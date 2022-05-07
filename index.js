/* 
	Code based on memory-chunk-store by mafintosh
	https://github.com/mafintosh/memory-chunk-store
	License: MIT (https://github.com/mafintosh/memory-chunk-store/blob/master/LICENSE)
*/

module.exports = Storage

const { randomUUID } = require("crypto")
const Client = require("@replit/database")

function Storage (chunkLength, opts) {
	if (!(this instanceof Storage)) return new Storage(chunkLength, opts)
	if (!opts) opts = {}

	this.chunkLength = Number(chunkLength)
	if (!this.chunkLength) throw new Error('First argument must be a chunk length')

	this.closed = false
	this.length = Number(opts.length) || Infinity

	if (this.length !== Infinity) {
		this.lastChunkLength = (this.length % this.chunkLength) || this.chunkLength
		this.lastChunkIndex = Math.ceil(this.length / this.chunkLength) - 1
	}

	this.prefix = `replit-chunk-store-${randomUUID()}-`
	this.client = new Client(opts.key)
}

Storage.prototype.put = async function (index, buf, cb = () => {}) {
	if (this.closed) return queueMicrotask(() => cb(new Error('Storage is closed')))

	const isLastChunk = (index === this.lastChunkIndex)
	if (isLastChunk && buf.length !== this.lastChunkLength) {
		return queueMicrotask(() => cb(new Error('Last chunk length must be ' + this.lastChunkLength)))
	}
	if (!isLastChunk && buf.length !== this.chunkLength) {
		return queueMicrotask(() => cb(new Error('Chunk length must be ' + this.chunkLength)))
	}
	await this.client.set(this.prefix + index, buf)
	queueMicrotask(() => cb(null))
}

Storage.prototype.get = async function (index, opts, cb = () => {}) {
	if (typeof opts === 'function') return this.get(index, null, opts)
	if (this.closed) return queueMicrotask(() => cb(new Error('Storage is closed')))

	// {type: 'Buffer', data: number[]}
	let value = await this.client.get(this.prefix + index)

	if (!value) {
		const err = new Error('Chunk not found')
		err.notFound = true
		return queueMicrotask(() => cb(err))
	}

	let buf = Buffer.from(value.data)

	if (!opts) opts = {}

	const offset = opts.offset || 0
	const len = opts.length || (buf.length - offset)

	if (offset !== 0 || len !== buf.length) {
		buf = buf.slice(offset, len + offset)
	}

	queueMicrotask(() => cb(null, buf))
}

Storage.prototype.close = Storage.prototype.destroy = async function (cb = () => {}) {
	if (this.closed) return queueMicrotask(() => cb(new Error('Storage is closed')))
	this.closed = true
	await this.client.deleteMultiple(await this.client.list(this.prefix))
	this.client = null
	this.prefix = null
	queueMicrotask(() => cb(null))
}
