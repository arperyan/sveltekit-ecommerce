var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i2 = 1; i2 < meta.length; i2++) {
    if (meta[i2] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i2]}`;
      if (meta[i2].indexOf("charset=") === 0) {
        charset = meta[i2].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error3) {
    if (error3 instanceof FetchBaseError) {
      throw error3;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error3.message}`, "system", error3);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c2) => typeof c2 === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error3) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error3.message}`, "system", error3);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = src(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error3 = new AbortError("The operation was aborted.");
      reject(error3);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error3);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error3);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error3) {
                reject(error3);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
        reject(error3);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
          reject(error3);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error3) => {
              reject(error3);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error3) => {
              reject(error3);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, Readable, wm, Blob2, fetchBlob, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob2 = class {
      constructor(blobParts = [], options2 = {}) {
        let size = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob2) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob2([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob2.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob2;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error3 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error3;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new fetchBlob([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p2, receiver) {
            switch (p2) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p2].call(receiver, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p2].call(receiver, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p2, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name of this.keys()) {
          callback(this.get(name), name);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash3 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash3.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-vercel/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-vercel/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/cookie/index.js"(exports) {
    init_shims();
    "use strict";
    exports.parse = parse2;
    exports.serialize = serialize;
    var decode = decodeURIComponent;
    var encode = encodeURIComponent;
    var pairSplitRegExp = /; */;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse2(str, options2) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options2 || {};
      var pairs = str.split(pairSplitRegExp);
      var dec = opt.decode || decode;
      for (var i2 = 0; i2 < pairs.length; i2++) {
        var pair = pairs[i2];
        var eq_idx = pair.indexOf("=");
        if (eq_idx < 0) {
          continue;
        }
        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();
        if (val[0] == '"') {
          val = val.slice(1, -1);
        }
        if (obj[key] == void 0) {
          obj[key] = tryDecode(val, dec);
        }
      }
      return obj;
    }
    function serialize(name, val, options2) {
      var opt = options2 || {};
      var enc = opt.encode || encode;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (opt.maxAge != null) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        if (typeof opt.expires.toUTCString !== "function") {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + opt.expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e2) {
        return str;
      }
    }
  }
});

// node_modules/extract-files/public/ReactNativeFile.js
var require_ReactNativeFile = __commonJS({
  "node_modules/extract-files/public/ReactNativeFile.js"(exports, module2) {
    init_shims();
    "use strict";
    module2.exports = class ReactNativeFile {
      constructor({ uri, name, type }) {
        this.uri = uri;
        this.name = name;
        this.type = type;
      }
    };
  }
});

// node_modules/extract-files/public/isExtractableFile.js
var require_isExtractableFile = __commonJS({
  "node_modules/extract-files/public/isExtractableFile.js"(exports, module2) {
    init_shims();
    "use strict";
    var ReactNativeFile = require_ReactNativeFile();
    module2.exports = function isExtractableFile(value) {
      return typeof File !== "undefined" && value instanceof File || typeof Blob !== "undefined" && value instanceof Blob || value instanceof ReactNativeFile;
    };
  }
});

// node_modules/extract-files/public/extractFiles.js
var require_extractFiles = __commonJS({
  "node_modules/extract-files/public/extractFiles.js"(exports, module2) {
    init_shims();
    "use strict";
    var defaultIsExtractableFile = require_isExtractableFile();
    module2.exports = function extractFiles(value, path = "", isExtractableFile = defaultIsExtractableFile) {
      const files = new Map();
      const clones = new Map();
      function recurse(value2, path2, recursed) {
        let clone2 = value2;
        if (isExtractableFile(value2)) {
          clone2 = null;
          const filePaths = files.get(value2);
          filePaths ? filePaths.push(path2) : files.set(value2, [path2]);
        } else {
          const isList = Array.isArray(value2) || typeof FileList !== "undefined" && value2 instanceof FileList;
          const isObject = value2 && value2.constructor === Object;
          if (isList || isObject) {
            const hasClone = clones.has(value2);
            if (hasClone)
              clone2 = clones.get(value2);
            else {
              clone2 = isList ? [] : {};
              clones.set(value2, clone2);
            }
            if (!recursed.has(value2)) {
              const pathPrefix = path2 ? `${path2}.` : "";
              const recursedDeeper = new Set(recursed).add(value2);
              if (isList) {
                let index2 = 0;
                for (const item of value2) {
                  const itemClone = recurse(item, pathPrefix + index2++, recursedDeeper);
                  if (!hasClone)
                    clone2.push(itemClone);
                }
              } else
                for (const key in value2) {
                  const propertyClone = recurse(value2[key], pathPrefix + key, recursedDeeper);
                  if (!hasClone)
                    clone2[key] = propertyClone;
                }
            }
          }
        }
        return clone2;
      }
      return {
        clone: recurse(value, path, new Set()),
        files
      };
    };
  }
});

// .svelte-kit/vercel/entry.js
__export(exports, {
  default: () => entry_default
});
init_shims();

// node_modules/@sveltejs/kit/dist/node.js
init_shims();

// node_modules/@sveltejs/kit/dist/adapter-utils.js
init_shims();
function isContentTypeTextual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}

// node_modules/@sveltejs/kit/dist/node.js
function getRawBody(req) {
  return new Promise((fulfil, reject) => {
    const h2 = req.headers;
    if (!h2["content-type"]) {
      return fulfil("");
    }
    req.on("error", reject);
    const length = Number(h2["content-length"]);
    if (isNaN(length) && h2["transfer-encoding"] == null) {
      return fulfil("");
    }
    let data = new Uint8Array(length || 0);
    if (length > 0) {
      let offset = 0;
      req.on("data", (chunk) => {
        const new_len = offset + Buffer.byteLength(chunk);
        if (new_len > length) {
          return reject({
            status: 413,
            reason: 'Exceeded "Content-Length" limit'
          });
        }
        data.set(chunk, offset);
        offset = new_len;
      });
    } else {
      req.on("data", (chunk) => {
        const new_data = new Uint8Array(data.length + chunk.length);
        new_data.set(data, 0);
        new_data.set(chunk, data.length);
        data = new_data;
      });
    }
    req.on("end", () => {
      const [type] = (h2["content-type"] || "").split(/;\s*/);
      if (isContentTypeTextual(type)) {
        const encoding = h2["content-encoding"] || "utf-8";
        return fulfil(new TextDecoder(encoding).decode(data));
      }
      fulfil(data);
    });
  });
}

// .svelte-kit/output/server/app.js
init_shims();

// node_modules/@sveltejs/kit/dist/ssr.js
init_shims();
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a2, b2) {
    return b2[1] - a2[1];
  }).forEach(function(entry, i2) {
    names.set(entry[0], getName(i2));
  });
  function stringify2(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify2(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v2, i2) {
          return i2 in thing ? stringify2(v2) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify2).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify2(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify2(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify2(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v2, i2) {
            statements_1.push(name + "[" + i2 + "]=" + stringify2(v2));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v2) {
            return "add(" + stringify2(v2) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k2 = _a[0], v2 = _a[1];
            return "set(" + stringify2(k2) + ", " + stringify2(v2) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify2(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c2) {
  return escaped$1[c2] || c2;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i2 = 0; i2 < str.length; i2 += 1) {
    var char = str.charAt(i2);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i2 + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i2];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a2, b2) {
  return a2 != a2 ? b2 == b2 : a2 !== b2 || (a2 && typeof a2 === "object" || typeof a2 === "function");
}
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i2 = 0; i2 < subscribers.length; i2 += 1) {
          const s3 = subscribers[i2];
          s3[1]();
          subscriber_queue.push(s3, value);
        }
        if (run_queue) {
          for (let i2 = 0; i2 < subscriber_queue.length; i2 += 2) {
            subscriber_queue[i2][0](subscriber_queue[i2 + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash3 = 5381;
  let i2 = value.length;
  if (typeof value === "string") {
    while (i2)
      hash3 = hash3 * 33 ^ value.charCodeAt(--i2);
  } else {
    while (i2)
      hash3 = hash3 * 33 ^ value[--i2];
  }
  return (hash3 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  options: options2,
  $session,
  page_config,
  status,
  error: error3,
  branch,
  page: page2
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error3) {
    error3.stack = options2.get_stack(error3);
  }
  if (branch) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page: page2,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i2 = 0; i2 < branch.length; i2 += 1) {
      props[`props_${i2}`] = await branch[i2].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error4) => {
      throw new Error(`Failed to serialize session data: ${error4.message}`);
    })},
				host: ${page2 && page2.host ? s$1(page2.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error3)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page2 && page2.host ? s$1(page2.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page2 && page2.path)},
						query: new URLSearchParams(${page2 ? s$1(page2.query.toString()) : ""}),
						params: ${page2 && s$1(page2.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error3) {
  if (!error3)
    return null;
  let serialized = try_serialize(error3);
  if (!serialized) {
    const { name, message, stack } = error3;
    serialized = try_serialize({ ...error3, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error3 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error3 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error3}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error3 };
    }
    return { status, error: error3 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
var absolute = /^([a-z]+:)?\/?\//;
function resolve(base, path) {
  const base_match = absolute.exec(base);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base}"`);
  }
  const baseparts = path_match ? [] : base.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i2 = 0; i2 < pathparts.length; i2 += 1) {
    const part = pathparts[i2];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page: page2,
  node,
  $session,
  context,
  is_leaf,
  is_error,
  status,
  error: error3
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  if (module2.load) {
    const load_input = {
      page: page2,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const filename = resolved.replace(options2.paths.assets, "").slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d2) => d2.file === filename || d2.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? {
              "content-type": asset.type
            } : {}
          }) : await fetch(`http://${page2.host}/${asset.file}`, opts);
        } else if (resolved.startsWith(options2.paths.base || "/")) {
          const relative = resolved.replace(options2.paths.base, "");
          const headers = { ...opts.headers };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body,
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.serverFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error3;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
var escaped = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape(str) {
  let result = '"';
  for (let i2 = 0; i2 < str.length; i2 += 1) {
    const char = str.charAt(i2);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i2 + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i2];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function coalesce_to_error(err) {
  return err instanceof Error ? err : new Error(JSON.stringify(err));
}
async function resolve_option(opt, ctx) {
  if (typeof opt === "function") {
    return await opt(ctx);
  }
  return opt;
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error3 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page: page2,
    node: default_layout,
    $session,
    context: {},
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page: page2,
      node: default_error,
      $session,
      context: loaded ? loaded.context : {},
      is_leaf: false,
      is_error: true,
      status,
      error: error3
    })
  ];
  const leaf_promise = async () => branch[branch.length - 1].node.module;
  const page_config = {
    ssr: await resolve_option(options2.ssr, { request, page: leaf_promise }),
    router: await resolve_option(options2.router, { request, page: leaf_promise }),
    hydrate: await resolve_option(options2.hydrate, { request, page: leaf_promise }),
    prerender: await resolve_option(options2.prerender, { request, page: leaf_promise })
  };
  try {
    return await render_response({
      options: options2,
      $session,
      page_config,
      status,
      error: error3,
      branch,
      page: page2
    });
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4);
    return {
      status: 500,
      headers: {},
      body: error4.stack
    };
  }
}
async function respond$1({ request, options: options2, state, $session, route }) {
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page2 = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const leaf_promise = options2.load_component(route.a[route.a.length - 1]).then((c2) => c2.module);
  const page_config = {
    ssr: await resolve_option(options2.ssr, { request, page: leaf_promise }),
    router: await resolve_option(options2.router, { request, page: leaf_promise }),
    hydrate: await resolve_option(options2.hydrate, { request, page: leaf_promise }),
    prerender: await resolve_option(options2.prerender, { request, page: leaf_promise })
  };
  if (state.prerender && !state.prerender.all && !page_config.prerender) {
    return {
      status: 204,
      headers: {},
      body: ""
    };
  }
  let branch;
  let status = 200;
  let error3;
  ssr:
    if (page_config.ssr) {
      let nodes;
      try {
        nodes = await Promise.all(route.a.map((id) => options2.load_component(id)));
      } catch (err) {
        const error4 = coalesce_to_error(err);
        options2.handle_error(error4);
        return await respond_with_error({
          request,
          options: options2,
          state,
          $session,
          status: 500,
          error: error4
        });
      }
      let context = {};
      branch = [];
      for (let i2 = 0; i2 < nodes.length; i2 += 1) {
        const node = nodes[i2];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              request,
              options: options2,
              state,
              route,
              page: page2,
              node,
              $session,
              context,
              is_leaf: i2 === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({ status, error: error3 } = loaded.loaded);
            } else {
              branch.push(loaded);
            }
          } catch (err) {
            const e2 = coalesce_to_error(err);
            options2.handle_error(e2);
            status = 500;
            error3 = e2;
          }
          if (error3) {
            while (i2--) {
              if (route.b[i2]) {
                const error_node = await options2.load_component(route.b[i2]);
                let error_loaded;
                let node_loaded;
                let j2 = i2;
                while (!(node_loaded = branch[j2])) {
                  j2 -= 1;
                }
                try {
                  error_loaded = await load_node({
                    request,
                    options: options2,
                    state,
                    route,
                    page: page2,
                    node: error_node,
                    $session,
                    context: node_loaded.context,
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error3
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  branch = branch.slice(0, j2 + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e2 = coalesce_to_error(err);
                  options2.handle_error(e2);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error3
            });
          }
        }
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      options: options2,
      $session,
      page_config,
      status,
      error: error3,
      branch: branch && branch.filter(Boolean),
      page: page2
    });
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
}
async function render_page(request, route, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options2.hooks.getSession(request);
  if (route) {
    const response = await respond$1({
      request,
      options: options2,
      state,
      $session,
      route
    });
    if (response) {
      return response;
    }
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  } else {
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 404,
      error: new Error(`Not found: ${request.path}`)
    });
  }
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s3) {
  return typeof s3 === "string" || s3 instanceof String;
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler) {
    return error("no handler");
  }
  const match = route.pattern.exec(request.path);
  if (!match) {
    return error("could not parse parameters from request path");
  }
  const params = route.params(match);
  const response = await handler({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return error("no response");
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = headers["content-type"];
  const is_type_textual = isContentTypeTextual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  #map;
  constructor(map) {
    this.#map = map;
  }
  get(key) {
    const value = this.#map.get(key);
    return value && value[0];
  }
  getAll(key) {
    return this.#map.get(key);
  }
  has(key) {
    return this.#map.has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of this.#map) {
      for (let i2 = 0; i2 < value.length; i2 += 1) {
        yield [key, value[i2]];
      }
    }
  }
  *entries() {
    for (const [key, value] of this.#map) {
      for (let i2 = 0; i2 < value.length; i2 += 1) {
        yield [key, value[i2]];
      }
    }
  }
  *keys() {
    for (const [key] of this.#map)
      yield key;
  }
  *values() {
    for (const [, value] of this.#map) {
      for (let i2 = 0; i2 < value.length; i2 += 1) {
        yield value[i2];
      }
    }
  }
};
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  if (typeof raw === "string") {
    const [type, ...directives] = headers["content-type"].split(/;\s*/);
    switch (type) {
      case "text/plain":
        return raw;
      case "application/json":
        return JSON.parse(raw);
      case "application/x-www-form-urlencoded":
        return get_urlencoded(raw);
      case "multipart/form-data": {
        const boundary = directives.find((directive) => directive.startsWith("boundary="));
        if (!boundary)
          throw new Error("Missing boundary");
        return get_multipart(raw, boundary.slice("boundary=".length));
      }
      default:
        throw new Error(`Invalid Content-Type ${type}`);
    }
  }
  return raw;
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: encodeURI(path + (q ? `?${q}` : ""))
        }
      };
    }
  }
  try {
    const headers = lowercase_keys(incoming.headers);
    return await options2.hooks.handle({
      request: {
        ...incoming,
        headers,
        body: parse_body(incoming.rawBody, headers),
        params: {},
        locals: {}
      },
      resolve: async (request) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request),
            page_config: { ssr: false, router: true, hydrate: true, prerender: true },
            status: 200,
            branch: []
          });
        }
        for (const route of options2.manifest.routes) {
          if (!route.pattern.test(request.path))
            continue;
          const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body || "")}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: ""
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        return await render_page(request, null, options2, state);
      }
    });
  } catch (err) {
    const e2 = coalesce_to_error(err);
    options2.handle_error(e2);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e2.stack : e2.message
    };
  }
}

// .svelte-kit/output/server/app.js
var import_cookie = __toModule(require_cookie());

// node_modules/@lukeed/uuid/dist/index.mjs
init_shims();
var IDX = 256;
var HEX = [];
var BUFFER;
while (IDX--)
  HEX[IDX] = (IDX + 256).toString(16).substring(1);
function v4() {
  var i2 = 0, num, out = "";
  if (!BUFFER || IDX + 16 > 256) {
    BUFFER = Array(i2 = 256);
    while (i2--)
      BUFFER[i2] = 256 * Math.random() | 0;
    i2 = IDX = 0;
  }
  for (; i2 < 16; i2++) {
    num = BUFFER[IDX + i2];
    if (i2 == 6)
      out += HEX[num & 15 | 64];
    else if (i2 == 8)
      out += HEX[num & 63 | 128];
    else
      out += HEX[num];
    if (i2 & 1 && i2 > 1 && i2 < 11)
      out += "-";
  }
  IDX++;
  return out;
}

// node_modules/extract-files/public/index.mjs
init_shims();
var import_extractFiles = __toModule(require_extractFiles());

// .svelte-kit/output/server/app.js
function noop$1() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function safe_not_equal2(a2, b2) {
  return a2 != a2 ? b2 == b2 : a2 !== b2 || (a2 && typeof a2 === "object" || typeof a2 === "function");
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop$1;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function null_to_empty(value) {
  return value == null ? "" : value;
}
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
Promise.resolve();
var escaped2 = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape2(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped2[match]);
}
function each(items, fn) {
  let str = "";
  for (let i2 = 0; i2 < items.length; i2 += 1) {
    str += fn(items[i2], i2);
  }
  return str;
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
var css$9 = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AAsDC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page: page2 } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page2 !== void 0)
    $$bindings.page(page2);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$9);
  {
    stores.page.set(page2);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${``}`;
});
function set_paths(paths) {
}
function set_prerendering(value) {
}
var handle = async ({ request, resolve: resolve2 }) => {
  const cookies = import_cookie.default.parse(request.headers.cookie || "");
  request.locals.userid = cookies.userid || v4();
  if (request.query.has("_method")) {
    request.method = request.query.get("_method").toUpperCase();
  }
  const response = await resolve2(request);
  if (!cookies.userid) {
    response.headers["set-cookie"] = `userid=${request.locals.userid}; Path=/; HttpOnly`;
  }
  return response;
};
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  handle
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
var options = null;
var default_settings = { paths: { "base": "", "assets": "/." } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-18985cd4.js",
      css: ["/./_app/assets/start-a8cd1609.css"],
      js: ["/./_app/start-18985cd4.js", "/./_app/chunks/vendor-592b037c.js", "/./_app/chunks/singletons-12a22614.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error22) => String(error22),
    handle_error: (error22) => {
      if (error22.frame) {
        console.error(error22.frame);
      }
      console.error(error22.stack);
      error22.stack = options.get_stack(error22);
    },
    hooks: get_hooks(user_hooks),
    hydrate: async ({ page: page2 }) => {
      const leaf = await page2;
      return "hydrate" in leaf ? !!leaf.hydrate : true;
    },
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: async ({ page: page2 }) => !!(await page2).prerender,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: async ({ page: page2 }) => {
      const leaf = await page2;
      return "router" in leaf ? !!leaf.router : true;
    },
    ssr: async ({ page: page2 }) => {
      const leaf = await page2;
      return "ssr" in leaf ? !!leaf.ssr : true;
    },
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var d$1 = decodeURIComponent;
var empty = () => ({});
var manifest = {
  assets: [{ "file": "favicon.ico", "size": 1150, "type": "image/vnd.microsoft.icon" }, { "file": "favicon.png", "size": 1571, "type": "image/png" }, { "file": "radnikanext-medium-webfont.woff2", "size": 20012, "type": "font/woff2" }, { "file": "radnikanext-medium-webfont.woff2\uF03AZone.Identifier", "size": 94, "type": null }, { "file": "robots.txt", "size": 67, "type": "text/plain" }, { "file": "svelte-welcome.png", "size": 360807, "type": "image/png" }, { "file": "svelte-welcome.webp", "size": 115470, "type": "image/webp" }],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/products\/([^/]+?)\/?$/,
      params: (m2) => ({ id: d$1(m2[1]) }),
      a: ["src/routes/__layout.svelte", "src/routes/products/[id].svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/product\/([^/]+?)\/?$/,
      params: (m2) => ({ id: d$1(m2[1]) }),
      a: ["src/routes/__layout.svelte", "src/routes/product/[id].svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/sell\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/sell.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  serverFetch: hooks.serverFetch || fetch
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error2;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }),
  "src/routes/products/[id].svelte": () => Promise.resolve().then(function() {
    return _id_$1;
  }),
  "src/routes/product/[id].svelte": () => Promise.resolve().then(function() {
    return _id_;
  }),
  "src/routes/sell.svelte": () => Promise.resolve().then(function() {
    return sell;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "/./_app/pages/__layout.svelte-a44909cc.js", "css": ["/./_app/assets/pages/__layout.svelte-d53691d7.css"], "js": ["/./_app/pages/__layout.svelte-a44909cc.js", "/./_app/chunks/vendor-592b037c.js", "/./_app/chunks/config-c94b3b2f.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "/./_app/error.svelte-5a17c2a5.js", "css": [], "js": ["/./_app/error.svelte-5a17c2a5.js", "/./_app/chunks/vendor-592b037c.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "/./_app/pages/index.svelte-e1621cd3.js", "css": ["/./_app/assets/pages/index.svelte-463a813d.css", "/./_app/assets/Product-ecac129e.css"], "js": ["/./_app/pages/index.svelte-e1621cd3.js", "/./_app/chunks/vendor-592b037c.js", "/./_app/chunks/Product-79c47321.js", "/./_app/chunks/stitches.config-5cea04f4.js"], "styles": [] }, "src/routes/products/[id].svelte": { "entry": "/./_app/pages/products/[id].svelte-453ec737.js", "css": ["/./_app/assets/pages/products/[id].svelte-925807dc.css", "/./_app/assets/ErrorMessage-41fefffe.css", "/./_app/assets/Product-ecac129e.css"], "js": ["/./_app/pages/products/[id].svelte-453ec737.js", "/./_app/chunks/vendor-592b037c.js", "/./_app/chunks/config-c94b3b2f.js", "/./_app/chunks/ErrorMessage-ddaa1315.js", "/./_app/chunks/stitches.config-5cea04f4.js", "/./_app/chunks/Product-79c47321.js"], "styles": [] }, "src/routes/product/[id].svelte": { "entry": "/./_app/pages/product/[id].svelte-18c4b778.js", "css": ["/./_app/assets/ErrorMessage-41fefffe.css"], "js": ["/./_app/pages/product/[id].svelte-18c4b778.js", "/./_app/chunks/vendor-592b037c.js", "/./_app/chunks/ErrorMessage-ddaa1315.js", "/./_app/chunks/stitches.config-5cea04f4.js"], "styles": [] }, "src/routes/sell.svelte": { "entry": "/./_app/pages/sell.svelte-a0170185.js", "css": ["/./_app/assets/ErrorMessage-41fefffe.css"], "js": ["/./_app/pages/sell.svelte-a0170185.js", "/./_app/chunks/vendor-592b037c.js", "/./_app/chunks/stitches.config-5cea04f4.js", "/./_app/chunks/ErrorMessage-ddaa1315.js", "/./_app/chunks/singletons-12a22614.js"], "styles": [] } };
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
function render(request, {
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender });
}
var nodejsCustomInspectSymbol = typeof Symbol === "function" && typeof Symbol.for === "function" ? Symbol.for("nodejs.util.inspect.custom") : void 0;
var nodejsCustomInspectSymbol$1 = nodejsCustomInspectSymbol;
function _typeof$2(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof$2 = function _typeof2(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof$2 = function _typeof2(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof$2(obj);
}
var MAX_ARRAY_LENGTH = 10;
var MAX_RECURSIVE_DEPTH = 2;
function inspect(value) {
  return formatValue(value, []);
}
function formatValue(value, seenValues) {
  switch (_typeof$2(value)) {
    case "string":
      return JSON.stringify(value);
    case "function":
      return value.name ? "[function ".concat(value.name, "]") : "[function]";
    case "object":
      if (value === null) {
        return "null";
      }
      return formatObjectValue(value, seenValues);
    default:
      return String(value);
  }
}
function formatObjectValue(value, previouslySeenValues) {
  if (previouslySeenValues.indexOf(value) !== -1) {
    return "[Circular]";
  }
  var seenValues = [].concat(previouslySeenValues, [value]);
  var customInspectFn = getCustomFn(value);
  if (customInspectFn !== void 0) {
    var customValue = customInspectFn.call(value);
    if (customValue !== value) {
      return typeof customValue === "string" ? customValue : formatValue(customValue, seenValues);
    }
  } else if (Array.isArray(value)) {
    return formatArray(value, seenValues);
  }
  return formatObject(value, seenValues);
}
function formatObject(object, seenValues) {
  var keys = Object.keys(object);
  if (keys.length === 0) {
    return "{}";
  }
  if (seenValues.length > MAX_RECURSIVE_DEPTH) {
    return "[" + getObjectTag(object) + "]";
  }
  var properties = keys.map(function(key) {
    var value = formatValue(object[key], seenValues);
    return key + ": " + value;
  });
  return "{ " + properties.join(", ") + " }";
}
function formatArray(array, seenValues) {
  if (array.length === 0) {
    return "[]";
  }
  if (seenValues.length > MAX_RECURSIVE_DEPTH) {
    return "[Array]";
  }
  var len = Math.min(MAX_ARRAY_LENGTH, array.length);
  var remaining = array.length - len;
  var items = [];
  for (var i2 = 0; i2 < len; ++i2) {
    items.push(formatValue(array[i2], seenValues));
  }
  if (remaining === 1) {
    items.push("... 1 more item");
  } else if (remaining > 1) {
    items.push("... ".concat(remaining, " more items"));
  }
  return "[" + items.join(", ") + "]";
}
function getCustomFn(object) {
  var customInspectFn = object[String(nodejsCustomInspectSymbol$1)];
  if (typeof customInspectFn === "function") {
    return customInspectFn;
  }
  if (typeof object.inspect === "function") {
    return object.inspect;
  }
}
function getObjectTag(object) {
  var tag = Object.prototype.toString.call(object).replace(/^\[object /, "").replace(/]$/, "");
  if (tag === "Object" && typeof object.constructor === "function") {
    var name = object.constructor.name;
    if (typeof name === "string" && name !== "") {
      return name;
    }
  }
  return tag;
}
function invariant(condition, message) {
  var booleanCondition = Boolean(condition);
  if (!booleanCondition) {
    throw new Error(message != null ? message : "Unexpected invariant triggered.");
  }
}
function defineInspect(classObject) {
  var fn = classObject.prototype.toJSON;
  typeof fn === "function" || invariant(0);
  classObject.prototype.inspect = fn;
  if (nodejsCustomInspectSymbol$1) {
    classObject.prototype[nodejsCustomInspectSymbol$1] = fn;
  }
}
var Location = /* @__PURE__ */ function() {
  function Location2(startToken, endToken, source) {
    this.start = startToken.start;
    this.end = endToken.end;
    this.startToken = startToken;
    this.endToken = endToken;
    this.source = source;
  }
  var _proto = Location2.prototype;
  _proto.toJSON = function toJSON() {
    return {
      start: this.start,
      end: this.end
    };
  };
  return Location2;
}();
defineInspect(Location);
var Token = /* @__PURE__ */ function() {
  function Token2(kind, start, end, line, column, prev, value) {
    this.kind = kind;
    this.start = start;
    this.end = end;
    this.line = line;
    this.column = column;
    this.value = value;
    this.prev = prev;
    this.next = null;
  }
  var _proto2 = Token2.prototype;
  _proto2.toJSON = function toJSON() {
    return {
      kind: this.kind,
      value: this.value,
      line: this.line,
      column: this.column
    };
  };
  return Token2;
}();
defineInspect(Token);
function isNode(maybeNode) {
  return maybeNode != null && typeof maybeNode.kind === "string";
}
var QueryDocumentKeys = {
  Name: [],
  Document: ["definitions"],
  OperationDefinition: ["name", "variableDefinitions", "directives", "selectionSet"],
  VariableDefinition: ["variable", "type", "defaultValue", "directives"],
  Variable: ["name"],
  SelectionSet: ["selections"],
  Field: ["alias", "name", "arguments", "directives", "selectionSet"],
  Argument: ["name", "value"],
  FragmentSpread: ["name", "directives"],
  InlineFragment: ["typeCondition", "directives", "selectionSet"],
  FragmentDefinition: [
    "name",
    "variableDefinitions",
    "typeCondition",
    "directives",
    "selectionSet"
  ],
  IntValue: [],
  FloatValue: [],
  StringValue: [],
  BooleanValue: [],
  NullValue: [],
  EnumValue: [],
  ListValue: ["values"],
  ObjectValue: ["fields"],
  ObjectField: ["name", "value"],
  Directive: ["name", "arguments"],
  NamedType: ["name"],
  ListType: ["type"],
  NonNullType: ["type"],
  SchemaDefinition: ["description", "directives", "operationTypes"],
  OperationTypeDefinition: ["type"],
  ScalarTypeDefinition: ["description", "name", "directives"],
  ObjectTypeDefinition: ["description", "name", "interfaces", "directives", "fields"],
  FieldDefinition: ["description", "name", "arguments", "type", "directives"],
  InputValueDefinition: ["description", "name", "type", "defaultValue", "directives"],
  InterfaceTypeDefinition: ["description", "name", "interfaces", "directives", "fields"],
  UnionTypeDefinition: ["description", "name", "directives", "types"],
  EnumTypeDefinition: ["description", "name", "directives", "values"],
  EnumValueDefinition: ["description", "name", "directives"],
  InputObjectTypeDefinition: ["description", "name", "directives", "fields"],
  DirectiveDefinition: ["description", "name", "arguments", "locations"],
  SchemaExtension: ["directives", "operationTypes"],
  ScalarTypeExtension: ["name", "directives"],
  ObjectTypeExtension: ["name", "interfaces", "directives", "fields"],
  InterfaceTypeExtension: ["name", "interfaces", "directives", "fields"],
  UnionTypeExtension: ["name", "directives", "types"],
  EnumTypeExtension: ["name", "directives", "values"],
  InputObjectTypeExtension: ["name", "directives", "fields"]
};
var BREAK = Object.freeze({});
function visit(root, visitor) {
  var visitorKeys = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : QueryDocumentKeys;
  var stack = void 0;
  var inArray = Array.isArray(root);
  var keys = [root];
  var index2 = -1;
  var edits = [];
  var node = void 0;
  var key = void 0;
  var parent = void 0;
  var path = [];
  var ancestors = [];
  var newRoot = root;
  do {
    index2++;
    var isLeaving = index2 === keys.length;
    var isEdited = isLeaving && edits.length !== 0;
    if (isLeaving) {
      key = ancestors.length === 0 ? void 0 : path[path.length - 1];
      node = parent;
      parent = ancestors.pop();
      if (isEdited) {
        if (inArray) {
          node = node.slice();
        } else {
          var clone2 = {};
          for (var _i2 = 0, _Object$keys2 = Object.keys(node); _i2 < _Object$keys2.length; _i2++) {
            var k2 = _Object$keys2[_i2];
            clone2[k2] = node[k2];
          }
          node = clone2;
        }
        var editOffset = 0;
        for (var ii = 0; ii < edits.length; ii++) {
          var editKey = edits[ii][0];
          var editValue = edits[ii][1];
          if (inArray) {
            editKey -= editOffset;
          }
          if (inArray && editValue === null) {
            node.splice(editKey, 1);
            editOffset++;
          } else {
            node[editKey] = editValue;
          }
        }
      }
      index2 = stack.index;
      keys = stack.keys;
      edits = stack.edits;
      inArray = stack.inArray;
      stack = stack.prev;
    } else {
      key = parent ? inArray ? index2 : keys[index2] : void 0;
      node = parent ? parent[key] : newRoot;
      if (node === null || node === void 0) {
        continue;
      }
      if (parent) {
        path.push(key);
      }
    }
    var result = void 0;
    if (!Array.isArray(node)) {
      if (!isNode(node)) {
        throw new Error("Invalid AST Node: ".concat(inspect(node), "."));
      }
      var visitFn = getVisitFn(visitor, node.kind, isLeaving);
      if (visitFn) {
        result = visitFn.call(visitor, node, key, parent, path, ancestors);
        if (result === BREAK) {
          break;
        }
        if (result === false) {
          if (!isLeaving) {
            path.pop();
            continue;
          }
        } else if (result !== void 0) {
          edits.push([key, result]);
          if (!isLeaving) {
            if (isNode(result)) {
              node = result;
            } else {
              path.pop();
              continue;
            }
          }
        }
      }
    }
    if (result === void 0 && isEdited) {
      edits.push([key, node]);
    }
    if (isLeaving) {
      path.pop();
    } else {
      var _visitorKeys$node$kin;
      stack = {
        inArray,
        index: index2,
        keys,
        edits,
        prev: stack
      };
      inArray = Array.isArray(node);
      keys = inArray ? node : (_visitorKeys$node$kin = visitorKeys[node.kind]) !== null && _visitorKeys$node$kin !== void 0 ? _visitorKeys$node$kin : [];
      index2 = -1;
      edits = [];
      if (parent) {
        ancestors.push(parent);
      }
      parent = node;
    }
  } while (stack !== void 0);
  if (edits.length !== 0) {
    newRoot = edits[edits.length - 1][1];
  }
  return newRoot;
}
function getVisitFn(visitor, kind, isLeaving) {
  var kindVisitor = visitor[kind];
  if (kindVisitor) {
    if (!isLeaving && typeof kindVisitor === "function") {
      return kindVisitor;
    }
    var kindSpecificVisitor = isLeaving ? kindVisitor.leave : kindVisitor.enter;
    if (typeof kindSpecificVisitor === "function") {
      return kindSpecificVisitor;
    }
  } else {
    var specificVisitor = isLeaving ? visitor.leave : visitor.enter;
    if (specificVisitor) {
      if (typeof specificVisitor === "function") {
        return specificVisitor;
      }
      var specificKindVisitor = specificVisitor[kind];
      if (typeof specificKindVisitor === "function") {
        return specificKindVisitor;
      }
    }
  }
}
var Kind = Object.freeze({
  NAME: "Name",
  DOCUMENT: "Document",
  OPERATION_DEFINITION: "OperationDefinition",
  VARIABLE_DEFINITION: "VariableDefinition",
  SELECTION_SET: "SelectionSet",
  FIELD: "Field",
  ARGUMENT: "Argument",
  FRAGMENT_SPREAD: "FragmentSpread",
  INLINE_FRAGMENT: "InlineFragment",
  FRAGMENT_DEFINITION: "FragmentDefinition",
  VARIABLE: "Variable",
  INT: "IntValue",
  FLOAT: "FloatValue",
  STRING: "StringValue",
  BOOLEAN: "BooleanValue",
  NULL: "NullValue",
  ENUM: "EnumValue",
  LIST: "ListValue",
  OBJECT: "ObjectValue",
  OBJECT_FIELD: "ObjectField",
  DIRECTIVE: "Directive",
  NAMED_TYPE: "NamedType",
  LIST_TYPE: "ListType",
  NON_NULL_TYPE: "NonNullType",
  SCHEMA_DEFINITION: "SchemaDefinition",
  OPERATION_TYPE_DEFINITION: "OperationTypeDefinition",
  SCALAR_TYPE_DEFINITION: "ScalarTypeDefinition",
  OBJECT_TYPE_DEFINITION: "ObjectTypeDefinition",
  FIELD_DEFINITION: "FieldDefinition",
  INPUT_VALUE_DEFINITION: "InputValueDefinition",
  INTERFACE_TYPE_DEFINITION: "InterfaceTypeDefinition",
  UNION_TYPE_DEFINITION: "UnionTypeDefinition",
  ENUM_TYPE_DEFINITION: "EnumTypeDefinition",
  ENUM_VALUE_DEFINITION: "EnumValueDefinition",
  INPUT_OBJECT_TYPE_DEFINITION: "InputObjectTypeDefinition",
  DIRECTIVE_DEFINITION: "DirectiveDefinition",
  SCHEMA_EXTENSION: "SchemaExtension",
  SCALAR_TYPE_EXTENSION: "ScalarTypeExtension",
  OBJECT_TYPE_EXTENSION: "ObjectTypeExtension",
  INTERFACE_TYPE_EXTENSION: "InterfaceTypeExtension",
  UNION_TYPE_EXTENSION: "UnionTypeExtension",
  ENUM_TYPE_EXTENSION: "EnumTypeExtension",
  INPUT_OBJECT_TYPE_EXTENSION: "InputObjectTypeExtension"
});
function dedentBlockStringValue(rawString) {
  var lines = rawString.split(/\r\n|[\n\r]/g);
  var commonIndent = getBlockStringIndentation(rawString);
  if (commonIndent !== 0) {
    for (var i2 = 1; i2 < lines.length; i2++) {
      lines[i2] = lines[i2].slice(commonIndent);
    }
  }
  var startLine = 0;
  while (startLine < lines.length && isBlank(lines[startLine])) {
    ++startLine;
  }
  var endLine = lines.length;
  while (endLine > startLine && isBlank(lines[endLine - 1])) {
    --endLine;
  }
  return lines.slice(startLine, endLine).join("\n");
}
function isBlank(str) {
  for (var i2 = 0; i2 < str.length; ++i2) {
    if (str[i2] !== " " && str[i2] !== "	") {
      return false;
    }
  }
  return true;
}
function getBlockStringIndentation(value) {
  var _commonIndent;
  var isFirstLine = true;
  var isEmptyLine = true;
  var indent2 = 0;
  var commonIndent = null;
  for (var i2 = 0; i2 < value.length; ++i2) {
    switch (value.charCodeAt(i2)) {
      case 13:
        if (value.charCodeAt(i2 + 1) === 10) {
          ++i2;
        }
      case 10:
        isFirstLine = false;
        isEmptyLine = true;
        indent2 = 0;
        break;
      case 9:
      case 32:
        ++indent2;
        break;
      default:
        if (isEmptyLine && !isFirstLine && (commonIndent === null || indent2 < commonIndent)) {
          commonIndent = indent2;
        }
        isEmptyLine = false;
    }
  }
  return (_commonIndent = commonIndent) !== null && _commonIndent !== void 0 ? _commonIndent : 0;
}
function printBlockString(value) {
  var indentation = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
  var preferMultipleLines = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
  var isSingleLine = value.indexOf("\n") === -1;
  var hasLeadingSpace = value[0] === " " || value[0] === "	";
  var hasTrailingQuote = value[value.length - 1] === '"';
  var hasTrailingSlash = value[value.length - 1] === "\\";
  var printAsMultipleLines = !isSingleLine || hasTrailingQuote || hasTrailingSlash || preferMultipleLines;
  var result = "";
  if (printAsMultipleLines && !(isSingleLine && hasLeadingSpace)) {
    result += "\n" + indentation;
  }
  result += indentation ? value.replace(/\n/g, "\n" + indentation) : value;
  if (printAsMultipleLines) {
    result += "\n";
  }
  return '"""' + result.replace(/"""/g, '\\"""') + '"""';
}
function print(ast) {
  return visit(ast, {
    leave: printDocASTReducer
  });
}
var MAX_LINE_LENGTH = 80;
var printDocASTReducer = {
  Name: function Name(node) {
    return node.value;
  },
  Variable: function Variable(node) {
    return "$" + node.name;
  },
  Document: function Document(node) {
    return join(node.definitions, "\n\n") + "\n";
  },
  OperationDefinition: function OperationDefinition(node) {
    var op = node.operation;
    var name = node.name;
    var varDefs = wrap("(", join(node.variableDefinitions, ", "), ")");
    var directives = join(node.directives, " ");
    var selectionSet = node.selectionSet;
    return !name && !directives && !varDefs && op === "query" ? selectionSet : join([op, join([name, varDefs]), directives, selectionSet], " ");
  },
  VariableDefinition: function VariableDefinition(_ref) {
    var variable = _ref.variable, type = _ref.type, defaultValue = _ref.defaultValue, directives = _ref.directives;
    return variable + ": " + type + wrap(" = ", defaultValue) + wrap(" ", join(directives, " "));
  },
  SelectionSet: function SelectionSet(_ref2) {
    var selections = _ref2.selections;
    return block(selections);
  },
  Field: function Field(_ref3) {
    var alias = _ref3.alias, name = _ref3.name, args = _ref3.arguments, directives = _ref3.directives, selectionSet = _ref3.selectionSet;
    var prefix = wrap("", alias, ": ") + name;
    var argsLine = prefix + wrap("(", join(args, ", "), ")");
    if (argsLine.length > MAX_LINE_LENGTH) {
      argsLine = prefix + wrap("(\n", indent(join(args, "\n")), "\n)");
    }
    return join([argsLine, join(directives, " "), selectionSet], " ");
  },
  Argument: function Argument(_ref4) {
    var name = _ref4.name, value = _ref4.value;
    return name + ": " + value;
  },
  FragmentSpread: function FragmentSpread(_ref5) {
    var name = _ref5.name, directives = _ref5.directives;
    return "..." + name + wrap(" ", join(directives, " "));
  },
  InlineFragment: function InlineFragment(_ref6) {
    var typeCondition = _ref6.typeCondition, directives = _ref6.directives, selectionSet = _ref6.selectionSet;
    return join(["...", wrap("on ", typeCondition), join(directives, " "), selectionSet], " ");
  },
  FragmentDefinition: function FragmentDefinition(_ref7) {
    var name = _ref7.name, typeCondition = _ref7.typeCondition, variableDefinitions = _ref7.variableDefinitions, directives = _ref7.directives, selectionSet = _ref7.selectionSet;
    return "fragment ".concat(name).concat(wrap("(", join(variableDefinitions, ", "), ")"), " ") + "on ".concat(typeCondition, " ").concat(wrap("", join(directives, " "), " ")) + selectionSet;
  },
  IntValue: function IntValue(_ref8) {
    var value = _ref8.value;
    return value;
  },
  FloatValue: function FloatValue(_ref9) {
    var value = _ref9.value;
    return value;
  },
  StringValue: function StringValue(_ref10, key) {
    var value = _ref10.value, isBlockString = _ref10.block;
    return isBlockString ? printBlockString(value, key === "description" ? "" : "  ") : JSON.stringify(value);
  },
  BooleanValue: function BooleanValue(_ref11) {
    var value = _ref11.value;
    return value ? "true" : "false";
  },
  NullValue: function NullValue() {
    return "null";
  },
  EnumValue: function EnumValue(_ref12) {
    var value = _ref12.value;
    return value;
  },
  ListValue: function ListValue(_ref13) {
    var values = _ref13.values;
    return "[" + join(values, ", ") + "]";
  },
  ObjectValue: function ObjectValue(_ref14) {
    var fields = _ref14.fields;
    return "{" + join(fields, ", ") + "}";
  },
  ObjectField: function ObjectField(_ref15) {
    var name = _ref15.name, value = _ref15.value;
    return name + ": " + value;
  },
  Directive: function Directive(_ref16) {
    var name = _ref16.name, args = _ref16.arguments;
    return "@" + name + wrap("(", join(args, ", "), ")");
  },
  NamedType: function NamedType(_ref17) {
    var name = _ref17.name;
    return name;
  },
  ListType: function ListType(_ref18) {
    var type = _ref18.type;
    return "[" + type + "]";
  },
  NonNullType: function NonNullType(_ref19) {
    var type = _ref19.type;
    return type + "!";
  },
  SchemaDefinition: addDescription(function(_ref20) {
    var directives = _ref20.directives, operationTypes = _ref20.operationTypes;
    return join(["schema", join(directives, " "), block(operationTypes)], " ");
  }),
  OperationTypeDefinition: function OperationTypeDefinition(_ref21) {
    var operation = _ref21.operation, type = _ref21.type;
    return operation + ": " + type;
  },
  ScalarTypeDefinition: addDescription(function(_ref22) {
    var name = _ref22.name, directives = _ref22.directives;
    return join(["scalar", name, join(directives, " ")], " ");
  }),
  ObjectTypeDefinition: addDescription(function(_ref23) {
    var name = _ref23.name, interfaces = _ref23.interfaces, directives = _ref23.directives, fields = _ref23.fields;
    return join(["type", name, wrap("implements ", join(interfaces, " & ")), join(directives, " "), block(fields)], " ");
  }),
  FieldDefinition: addDescription(function(_ref24) {
    var name = _ref24.name, args = _ref24.arguments, type = _ref24.type, directives = _ref24.directives;
    return name + (hasMultilineItems(args) ? wrap("(\n", indent(join(args, "\n")), "\n)") : wrap("(", join(args, ", "), ")")) + ": " + type + wrap(" ", join(directives, " "));
  }),
  InputValueDefinition: addDescription(function(_ref25) {
    var name = _ref25.name, type = _ref25.type, defaultValue = _ref25.defaultValue, directives = _ref25.directives;
    return join([name + ": " + type, wrap("= ", defaultValue), join(directives, " ")], " ");
  }),
  InterfaceTypeDefinition: addDescription(function(_ref26) {
    var name = _ref26.name, interfaces = _ref26.interfaces, directives = _ref26.directives, fields = _ref26.fields;
    return join(["interface", name, wrap("implements ", join(interfaces, " & ")), join(directives, " "), block(fields)], " ");
  }),
  UnionTypeDefinition: addDescription(function(_ref27) {
    var name = _ref27.name, directives = _ref27.directives, types2 = _ref27.types;
    return join(["union", name, join(directives, " "), types2 && types2.length !== 0 ? "= " + join(types2, " | ") : ""], " ");
  }),
  EnumTypeDefinition: addDescription(function(_ref28) {
    var name = _ref28.name, directives = _ref28.directives, values = _ref28.values;
    return join(["enum", name, join(directives, " "), block(values)], " ");
  }),
  EnumValueDefinition: addDescription(function(_ref29) {
    var name = _ref29.name, directives = _ref29.directives;
    return join([name, join(directives, " ")], " ");
  }),
  InputObjectTypeDefinition: addDescription(function(_ref30) {
    var name = _ref30.name, directives = _ref30.directives, fields = _ref30.fields;
    return join(["input", name, join(directives, " "), block(fields)], " ");
  }),
  DirectiveDefinition: addDescription(function(_ref31) {
    var name = _ref31.name, args = _ref31.arguments, repeatable = _ref31.repeatable, locations = _ref31.locations;
    return "directive @" + name + (hasMultilineItems(args) ? wrap("(\n", indent(join(args, "\n")), "\n)") : wrap("(", join(args, ", "), ")")) + (repeatable ? " repeatable" : "") + " on " + join(locations, " | ");
  }),
  SchemaExtension: function SchemaExtension(_ref32) {
    var directives = _ref32.directives, operationTypes = _ref32.operationTypes;
    return join(["extend schema", join(directives, " "), block(operationTypes)], " ");
  },
  ScalarTypeExtension: function ScalarTypeExtension(_ref33) {
    var name = _ref33.name, directives = _ref33.directives;
    return join(["extend scalar", name, join(directives, " ")], " ");
  },
  ObjectTypeExtension: function ObjectTypeExtension(_ref34) {
    var name = _ref34.name, interfaces = _ref34.interfaces, directives = _ref34.directives, fields = _ref34.fields;
    return join(["extend type", name, wrap("implements ", join(interfaces, " & ")), join(directives, " "), block(fields)], " ");
  },
  InterfaceTypeExtension: function InterfaceTypeExtension(_ref35) {
    var name = _ref35.name, interfaces = _ref35.interfaces, directives = _ref35.directives, fields = _ref35.fields;
    return join(["extend interface", name, wrap("implements ", join(interfaces, " & ")), join(directives, " "), block(fields)], " ");
  },
  UnionTypeExtension: function UnionTypeExtension(_ref36) {
    var name = _ref36.name, directives = _ref36.directives, types2 = _ref36.types;
    return join(["extend union", name, join(directives, " "), types2 && types2.length !== 0 ? "= " + join(types2, " | ") : ""], " ");
  },
  EnumTypeExtension: function EnumTypeExtension(_ref37) {
    var name = _ref37.name, directives = _ref37.directives, values = _ref37.values;
    return join(["extend enum", name, join(directives, " "), block(values)], " ");
  },
  InputObjectTypeExtension: function InputObjectTypeExtension(_ref38) {
    var name = _ref38.name, directives = _ref38.directives, fields = _ref38.fields;
    return join(["extend input", name, join(directives, " "), block(fields)], " ");
  }
};
function addDescription(cb) {
  return function(node) {
    return join([node.description, cb(node)], "\n");
  };
}
function join(maybeArray) {
  var _maybeArray$filter$jo;
  var separator = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
  return (_maybeArray$filter$jo = maybeArray === null || maybeArray === void 0 ? void 0 : maybeArray.filter(function(x2) {
    return x2;
  }).join(separator)) !== null && _maybeArray$filter$jo !== void 0 ? _maybeArray$filter$jo : "";
}
function block(array) {
  return wrap("{\n", indent(join(array, "\n")), "\n}");
}
function wrap(start, maybeString) {
  var end = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "";
  return maybeString != null && maybeString !== "" ? start + maybeString + end : "";
}
function indent(str) {
  return wrap("  ", str.replace(/\n/g, "\n  "));
}
function isMultiline(str) {
  return str.indexOf("\n") !== -1;
}
function hasMultilineItems(maybeArray) {
  return maybeArray != null && maybeArray.some(isMultiline);
}
function _typeof$1(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof$1 = function _typeof2(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof$1 = function _typeof2(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof$1(obj);
}
function isObjectLike(value) {
  return _typeof$1(value) == "object" && value !== null;
}
var SYMBOL_TO_STRING_TAG = typeof Symbol === "function" && Symbol.toStringTag != null ? Symbol.toStringTag : "@@toStringTag";
function getLocation(source, position) {
  var lineRegexp = /\r\n|[\n\r]/g;
  var line = 1;
  var column = position + 1;
  var match;
  while ((match = lineRegexp.exec(source.body)) && match.index < position) {
    line += 1;
    column = position + 1 - (match.index + match[0].length);
  }
  return {
    line,
    column
  };
}
function printLocation(location) {
  return printSourceLocation(location.source, getLocation(location.source, location.start));
}
function printSourceLocation(source, sourceLocation) {
  var firstLineColumnOffset = source.locationOffset.column - 1;
  var body = whitespace(firstLineColumnOffset) + source.body;
  var lineIndex = sourceLocation.line - 1;
  var lineOffset = source.locationOffset.line - 1;
  var lineNum = sourceLocation.line + lineOffset;
  var columnOffset = sourceLocation.line === 1 ? firstLineColumnOffset : 0;
  var columnNum = sourceLocation.column + columnOffset;
  var locationStr = "".concat(source.name, ":").concat(lineNum, ":").concat(columnNum, "\n");
  var lines = body.split(/\r\n|[\n\r]/g);
  var locationLine = lines[lineIndex];
  if (locationLine.length > 120) {
    var subLineIndex = Math.floor(columnNum / 80);
    var subLineColumnNum = columnNum % 80;
    var subLines = [];
    for (var i2 = 0; i2 < locationLine.length; i2 += 80) {
      subLines.push(locationLine.slice(i2, i2 + 80));
    }
    return locationStr + printPrefixedLines([["".concat(lineNum), subLines[0]]].concat(subLines.slice(1, subLineIndex + 1).map(function(subLine) {
      return ["", subLine];
    }), [[" ", whitespace(subLineColumnNum - 1) + "^"], ["", subLines[subLineIndex + 1]]]));
  }
  return locationStr + printPrefixedLines([
    ["".concat(lineNum - 1), lines[lineIndex - 1]],
    ["".concat(lineNum), locationLine],
    ["", whitespace(columnNum - 1) + "^"],
    ["".concat(lineNum + 1), lines[lineIndex + 1]]
  ]);
}
function printPrefixedLines(lines) {
  var existingLines = lines.filter(function(_ref) {
    _ref[0];
    var line = _ref[1];
    return line !== void 0;
  });
  var padLen = Math.max.apply(Math, existingLines.map(function(_ref2) {
    var prefix = _ref2[0];
    return prefix.length;
  }));
  return existingLines.map(function(_ref3) {
    var prefix = _ref3[0], line = _ref3[1];
    return leftPad(padLen, prefix) + (line ? " | " + line : " |");
  }).join("\n");
}
function whitespace(len) {
  return Array(len + 1).join(" ");
}
function leftPad(len, str) {
  return whitespace(len - str.length) + str;
}
function _typeof(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof2(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof = function _typeof2(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof(obj);
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties$1(target, props) {
  for (var i2 = 0; i2 < props.length; i2++) {
    var descriptor = props[i2];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass$1(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties$1(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties$1(Constructor, staticProps);
  return Constructor;
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });
  if (superClass)
    _setPrototypeOf(subClass, superClass);
}
function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();
  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived), result;
    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return _possibleConstructorReturn(this, result);
  };
}
function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self);
}
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}
function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : void 0;
  _wrapNativeSuper = function _wrapNativeSuper2(Class2) {
    if (Class2 === null || !_isNativeFunction(Class2))
      return Class2;
    if (typeof Class2 !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }
    if (typeof _cache !== "undefined") {
      if (_cache.has(Class2))
        return _cache.get(Class2);
      _cache.set(Class2, Wrapper);
    }
    function Wrapper() {
      return _construct(Class2, arguments, _getPrototypeOf(this).constructor);
    }
    Wrapper.prototype = Object.create(Class2.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } });
    return _setPrototypeOf(Wrapper, Class2);
  };
  return _wrapNativeSuper(Class);
}
function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct2(Parent2, args2, Class2) {
      var a2 = [null];
      a2.push.apply(a2, args2);
      var Constructor = Function.bind.apply(Parent2, a2);
      var instance = new Constructor();
      if (Class2)
        _setPrototypeOf(instance, Class2.prototype);
      return instance;
    };
  }
  return _construct.apply(null, arguments);
}
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct)
    return false;
  if (Reflect.construct.sham)
    return false;
  if (typeof Proxy === "function")
    return true;
  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function() {
    }));
    return true;
  } catch (e2) {
    return false;
  }
}
function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}
function _setPrototypeOf(o2, p2) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf2(o3, p3) {
    o3.__proto__ = p3;
    return o3;
  };
  return _setPrototypeOf(o2, p2);
}
function _getPrototypeOf(o2) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf2(o3) {
    return o3.__proto__ || Object.getPrototypeOf(o3);
  };
  return _getPrototypeOf(o2);
}
var GraphQLError = /* @__PURE__ */ function(_Error) {
  _inherits(GraphQLError2, _Error);
  var _super = _createSuper(GraphQLError2);
  function GraphQLError2(message, nodes, source, positions, path, originalError, extensions) {
    var _locations2, _source2, _positions2, _extensions2;
    var _this;
    _classCallCheck(this, GraphQLError2);
    _this = _super.call(this, message);
    var _nodes = Array.isArray(nodes) ? nodes.length !== 0 ? nodes : void 0 : nodes ? [nodes] : void 0;
    var _source = source;
    if (!_source && _nodes) {
      var _nodes$0$loc;
      _source = (_nodes$0$loc = _nodes[0].loc) === null || _nodes$0$loc === void 0 ? void 0 : _nodes$0$loc.source;
    }
    var _positions = positions;
    if (!_positions && _nodes) {
      _positions = _nodes.reduce(function(list, node) {
        if (node.loc) {
          list.push(node.loc.start);
        }
        return list;
      }, []);
    }
    if (_positions && _positions.length === 0) {
      _positions = void 0;
    }
    var _locations;
    if (positions && source) {
      _locations = positions.map(function(pos) {
        return getLocation(source, pos);
      });
    } else if (_nodes) {
      _locations = _nodes.reduce(function(list, node) {
        if (node.loc) {
          list.push(getLocation(node.loc.source, node.loc.start));
        }
        return list;
      }, []);
    }
    var _extensions = extensions;
    if (_extensions == null && originalError != null) {
      var originalExtensions = originalError.extensions;
      if (isObjectLike(originalExtensions)) {
        _extensions = originalExtensions;
      }
    }
    Object.defineProperties(_assertThisInitialized(_this), {
      name: {
        value: "GraphQLError"
      },
      message: {
        value: message,
        enumerable: true,
        writable: true
      },
      locations: {
        value: (_locations2 = _locations) !== null && _locations2 !== void 0 ? _locations2 : void 0,
        enumerable: _locations != null
      },
      path: {
        value: path !== null && path !== void 0 ? path : void 0,
        enumerable: path != null
      },
      nodes: {
        value: _nodes !== null && _nodes !== void 0 ? _nodes : void 0
      },
      source: {
        value: (_source2 = _source) !== null && _source2 !== void 0 ? _source2 : void 0
      },
      positions: {
        value: (_positions2 = _positions) !== null && _positions2 !== void 0 ? _positions2 : void 0
      },
      originalError: {
        value: originalError
      },
      extensions: {
        value: (_extensions2 = _extensions) !== null && _extensions2 !== void 0 ? _extensions2 : void 0,
        enumerable: _extensions != null
      }
    });
    if (originalError !== null && originalError !== void 0 && originalError.stack) {
      Object.defineProperty(_assertThisInitialized(_this), "stack", {
        value: originalError.stack,
        writable: true,
        configurable: true
      });
      return _possibleConstructorReturn(_this);
    }
    if (Error.captureStackTrace) {
      Error.captureStackTrace(_assertThisInitialized(_this), GraphQLError2);
    } else {
      Object.defineProperty(_assertThisInitialized(_this), "stack", {
        value: Error().stack,
        writable: true,
        configurable: true
      });
    }
    return _this;
  }
  _createClass$1(GraphQLError2, [{
    key: "toString",
    value: function toString() {
      return printError(this);
    }
  }, {
    key: SYMBOL_TO_STRING_TAG,
    get: function get() {
      return "Object";
    }
  }]);
  return GraphQLError2;
}(/* @__PURE__ */ _wrapNativeSuper(Error));
function printError(error22) {
  var output = error22.message;
  if (error22.nodes) {
    for (var _i2 = 0, _error$nodes2 = error22.nodes; _i2 < _error$nodes2.length; _i2++) {
      var node = _error$nodes2[_i2];
      if (node.loc) {
        output += "\n\n" + printLocation(node.loc);
      }
    }
  } else if (error22.source && error22.locations) {
    for (var _i4 = 0, _error$locations2 = error22.locations; _i4 < _error$locations2.length; _i4++) {
      var location = _error$locations2[_i4];
      output += "\n\n" + printSourceLocation(error22.source, location);
    }
  }
  return output;
}
function syntaxError(source, position, description) {
  return new GraphQLError("Syntax Error: ".concat(description), void 0, source, [position]);
}
var TokenKind = Object.freeze({
  SOF: "<SOF>",
  EOF: "<EOF>",
  BANG: "!",
  DOLLAR: "$",
  AMP: "&",
  PAREN_L: "(",
  PAREN_R: ")",
  SPREAD: "...",
  COLON: ":",
  EQUALS: "=",
  AT: "@",
  BRACKET_L: "[",
  BRACKET_R: "]",
  BRACE_L: "{",
  PIPE: "|",
  BRACE_R: "}",
  NAME: "Name",
  INT: "Int",
  FLOAT: "Float",
  STRING: "String",
  BLOCK_STRING: "BlockString",
  COMMENT: "Comment"
});
function devAssert(condition, message) {
  var booleanCondition = Boolean(condition);
  if (!booleanCondition) {
    throw new Error(message);
  }
}
var instanceOf = function instanceOf2(value, constructor) {
  return value instanceof constructor;
};
function _defineProperties(target, props) {
  for (var i2 = 0; i2 < props.length; i2++) {
    var descriptor = props[i2];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties(Constructor, staticProps);
  return Constructor;
}
var Source = /* @__PURE__ */ function() {
  function Source2(body) {
    var name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "GraphQL request";
    var locationOffset = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
      line: 1,
      column: 1
    };
    typeof body === "string" || devAssert(0, "Body must be a string. Received: ".concat(inspect(body), "."));
    this.body = body;
    this.name = name;
    this.locationOffset = locationOffset;
    this.locationOffset.line > 0 || devAssert(0, "line in locationOffset is 1-indexed and must be positive.");
    this.locationOffset.column > 0 || devAssert(0, "column in locationOffset is 1-indexed and must be positive.");
  }
  _createClass(Source2, [{
    key: SYMBOL_TO_STRING_TAG,
    get: function get() {
      return "Source";
    }
  }]);
  return Source2;
}();
function isSource(source) {
  return instanceOf(source, Source);
}
var DirectiveLocation = Object.freeze({
  QUERY: "QUERY",
  MUTATION: "MUTATION",
  SUBSCRIPTION: "SUBSCRIPTION",
  FIELD: "FIELD",
  FRAGMENT_DEFINITION: "FRAGMENT_DEFINITION",
  FRAGMENT_SPREAD: "FRAGMENT_SPREAD",
  INLINE_FRAGMENT: "INLINE_FRAGMENT",
  VARIABLE_DEFINITION: "VARIABLE_DEFINITION",
  SCHEMA: "SCHEMA",
  SCALAR: "SCALAR",
  OBJECT: "OBJECT",
  FIELD_DEFINITION: "FIELD_DEFINITION",
  ARGUMENT_DEFINITION: "ARGUMENT_DEFINITION",
  INTERFACE: "INTERFACE",
  UNION: "UNION",
  ENUM: "ENUM",
  ENUM_VALUE: "ENUM_VALUE",
  INPUT_OBJECT: "INPUT_OBJECT",
  INPUT_FIELD_DEFINITION: "INPUT_FIELD_DEFINITION"
});
var Lexer = /* @__PURE__ */ function() {
  function Lexer2(source) {
    var startOfFileToken = new Token(TokenKind.SOF, 0, 0, 0, 0, null);
    this.source = source;
    this.lastToken = startOfFileToken;
    this.token = startOfFileToken;
    this.line = 1;
    this.lineStart = 0;
  }
  var _proto = Lexer2.prototype;
  _proto.advance = function advance() {
    this.lastToken = this.token;
    var token = this.token = this.lookahead();
    return token;
  };
  _proto.lookahead = function lookahead() {
    var token = this.token;
    if (token.kind !== TokenKind.EOF) {
      do {
        var _token$next;
        token = (_token$next = token.next) !== null && _token$next !== void 0 ? _token$next : token.next = readToken(this, token);
      } while (token.kind === TokenKind.COMMENT);
    }
    return token;
  };
  return Lexer2;
}();
function isPunctuatorTokenKind(kind) {
  return kind === TokenKind.BANG || kind === TokenKind.DOLLAR || kind === TokenKind.AMP || kind === TokenKind.PAREN_L || kind === TokenKind.PAREN_R || kind === TokenKind.SPREAD || kind === TokenKind.COLON || kind === TokenKind.EQUALS || kind === TokenKind.AT || kind === TokenKind.BRACKET_L || kind === TokenKind.BRACKET_R || kind === TokenKind.BRACE_L || kind === TokenKind.PIPE || kind === TokenKind.BRACE_R;
}
function printCharCode(code) {
  return isNaN(code) ? TokenKind.EOF : code < 127 ? JSON.stringify(String.fromCharCode(code)) : '"\\u'.concat(("00" + code.toString(16).toUpperCase()).slice(-4), '"');
}
function readToken(lexer, prev) {
  var source = lexer.source;
  var body = source.body;
  var bodyLength = body.length;
  var pos = prev.end;
  while (pos < bodyLength) {
    var code = body.charCodeAt(pos);
    var _line = lexer.line;
    var _col = 1 + pos - lexer.lineStart;
    switch (code) {
      case 65279:
      case 9:
      case 32:
      case 44:
        ++pos;
        continue;
      case 10:
        ++pos;
        ++lexer.line;
        lexer.lineStart = pos;
        continue;
      case 13:
        if (body.charCodeAt(pos + 1) === 10) {
          pos += 2;
        } else {
          ++pos;
        }
        ++lexer.line;
        lexer.lineStart = pos;
        continue;
      case 33:
        return new Token(TokenKind.BANG, pos, pos + 1, _line, _col, prev);
      case 35:
        return readComment(source, pos, _line, _col, prev);
      case 36:
        return new Token(TokenKind.DOLLAR, pos, pos + 1, _line, _col, prev);
      case 38:
        return new Token(TokenKind.AMP, pos, pos + 1, _line, _col, prev);
      case 40:
        return new Token(TokenKind.PAREN_L, pos, pos + 1, _line, _col, prev);
      case 41:
        return new Token(TokenKind.PAREN_R, pos, pos + 1, _line, _col, prev);
      case 46:
        if (body.charCodeAt(pos + 1) === 46 && body.charCodeAt(pos + 2) === 46) {
          return new Token(TokenKind.SPREAD, pos, pos + 3, _line, _col, prev);
        }
        break;
      case 58:
        return new Token(TokenKind.COLON, pos, pos + 1, _line, _col, prev);
      case 61:
        return new Token(TokenKind.EQUALS, pos, pos + 1, _line, _col, prev);
      case 64:
        return new Token(TokenKind.AT, pos, pos + 1, _line, _col, prev);
      case 91:
        return new Token(TokenKind.BRACKET_L, pos, pos + 1, _line, _col, prev);
      case 93:
        return new Token(TokenKind.BRACKET_R, pos, pos + 1, _line, _col, prev);
      case 123:
        return new Token(TokenKind.BRACE_L, pos, pos + 1, _line, _col, prev);
      case 124:
        return new Token(TokenKind.PIPE, pos, pos + 1, _line, _col, prev);
      case 125:
        return new Token(TokenKind.BRACE_R, pos, pos + 1, _line, _col, prev);
      case 34:
        if (body.charCodeAt(pos + 1) === 34 && body.charCodeAt(pos + 2) === 34) {
          return readBlockString(source, pos, _line, _col, prev, lexer);
        }
        return readString(source, pos, _line, _col, prev);
      case 45:
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        return readNumber(source, pos, code, _line, _col, prev);
      case 65:
      case 66:
      case 67:
      case 68:
      case 69:
      case 70:
      case 71:
      case 72:
      case 73:
      case 74:
      case 75:
      case 76:
      case 77:
      case 78:
      case 79:
      case 80:
      case 81:
      case 82:
      case 83:
      case 84:
      case 85:
      case 86:
      case 87:
      case 88:
      case 89:
      case 90:
      case 95:
      case 97:
      case 98:
      case 99:
      case 100:
      case 101:
      case 102:
      case 103:
      case 104:
      case 105:
      case 106:
      case 107:
      case 108:
      case 109:
      case 110:
      case 111:
      case 112:
      case 113:
      case 114:
      case 115:
      case 116:
      case 117:
      case 118:
      case 119:
      case 120:
      case 121:
      case 122:
        return readName(source, pos, _line, _col, prev);
    }
    throw syntaxError(source, pos, unexpectedCharacterMessage(code));
  }
  var line = lexer.line;
  var col = 1 + pos - lexer.lineStart;
  return new Token(TokenKind.EOF, bodyLength, bodyLength, line, col, prev);
}
function unexpectedCharacterMessage(code) {
  if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
    return "Cannot contain the invalid character ".concat(printCharCode(code), ".");
  }
  if (code === 39) {
    return `Unexpected single quote character ('), did you mean to use a double quote (")?`;
  }
  return "Cannot parse the unexpected character ".concat(printCharCode(code), ".");
}
function readComment(source, start, line, col, prev) {
  var body = source.body;
  var code;
  var position = start;
  do {
    code = body.charCodeAt(++position);
  } while (!isNaN(code) && (code > 31 || code === 9));
  return new Token(TokenKind.COMMENT, start, position, line, col, prev, body.slice(start + 1, position));
}
function readNumber(source, start, firstCode, line, col, prev) {
  var body = source.body;
  var code = firstCode;
  var position = start;
  var isFloat = false;
  if (code === 45) {
    code = body.charCodeAt(++position);
  }
  if (code === 48) {
    code = body.charCodeAt(++position);
    if (code >= 48 && code <= 57) {
      throw syntaxError(source, position, "Invalid number, unexpected digit after 0: ".concat(printCharCode(code), "."));
    }
  } else {
    position = readDigits(source, position, code);
    code = body.charCodeAt(position);
  }
  if (code === 46) {
    isFloat = true;
    code = body.charCodeAt(++position);
    position = readDigits(source, position, code);
    code = body.charCodeAt(position);
  }
  if (code === 69 || code === 101) {
    isFloat = true;
    code = body.charCodeAt(++position);
    if (code === 43 || code === 45) {
      code = body.charCodeAt(++position);
    }
    position = readDigits(source, position, code);
    code = body.charCodeAt(position);
  }
  if (code === 46 || isNameStart(code)) {
    throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
  }
  return new Token(isFloat ? TokenKind.FLOAT : TokenKind.INT, start, position, line, col, prev, body.slice(start, position));
}
function readDigits(source, start, firstCode) {
  var body = source.body;
  var position = start;
  var code = firstCode;
  if (code >= 48 && code <= 57) {
    do {
      code = body.charCodeAt(++position);
    } while (code >= 48 && code <= 57);
    return position;
  }
  throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
}
function readString(source, start, line, col, prev) {
  var body = source.body;
  var position = start + 1;
  var chunkStart = position;
  var code = 0;
  var value = "";
  while (position < body.length && !isNaN(code = body.charCodeAt(position)) && code !== 10 && code !== 13) {
    if (code === 34) {
      value += body.slice(chunkStart, position);
      return new Token(TokenKind.STRING, start, position + 1, line, col, prev, value);
    }
    if (code < 32 && code !== 9) {
      throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
    }
    ++position;
    if (code === 92) {
      value += body.slice(chunkStart, position - 1);
      code = body.charCodeAt(position);
      switch (code) {
        case 34:
          value += '"';
          break;
        case 47:
          value += "/";
          break;
        case 92:
          value += "\\";
          break;
        case 98:
          value += "\b";
          break;
        case 102:
          value += "\f";
          break;
        case 110:
          value += "\n";
          break;
        case 114:
          value += "\r";
          break;
        case 116:
          value += "	";
          break;
        case 117: {
          var charCode = uniCharCode(body.charCodeAt(position + 1), body.charCodeAt(position + 2), body.charCodeAt(position + 3), body.charCodeAt(position + 4));
          if (charCode < 0) {
            var invalidSequence = body.slice(position + 1, position + 5);
            throw syntaxError(source, position, "Invalid character escape sequence: \\u".concat(invalidSequence, "."));
          }
          value += String.fromCharCode(charCode);
          position += 4;
          break;
        }
        default:
          throw syntaxError(source, position, "Invalid character escape sequence: \\".concat(String.fromCharCode(code), "."));
      }
      ++position;
      chunkStart = position;
    }
  }
  throw syntaxError(source, position, "Unterminated string.");
}
function readBlockString(source, start, line, col, prev, lexer) {
  var body = source.body;
  var position = start + 3;
  var chunkStart = position;
  var code = 0;
  var rawValue = "";
  while (position < body.length && !isNaN(code = body.charCodeAt(position))) {
    if (code === 34 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34) {
      rawValue += body.slice(chunkStart, position);
      return new Token(TokenKind.BLOCK_STRING, start, position + 3, line, col, prev, dedentBlockStringValue(rawValue));
    }
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
    }
    if (code === 10) {
      ++position;
      ++lexer.line;
      lexer.lineStart = position;
    } else if (code === 13) {
      if (body.charCodeAt(position + 1) === 10) {
        position += 2;
      } else {
        ++position;
      }
      ++lexer.line;
      lexer.lineStart = position;
    } else if (code === 92 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34 && body.charCodeAt(position + 3) === 34) {
      rawValue += body.slice(chunkStart, position) + '"""';
      position += 4;
      chunkStart = position;
    } else {
      ++position;
    }
  }
  throw syntaxError(source, position, "Unterminated string.");
}
function uniCharCode(a2, b2, c2, d2) {
  return char2hex(a2) << 12 | char2hex(b2) << 8 | char2hex(c2) << 4 | char2hex(d2);
}
function char2hex(a2) {
  return a2 >= 48 && a2 <= 57 ? a2 - 48 : a2 >= 65 && a2 <= 70 ? a2 - 55 : a2 >= 97 && a2 <= 102 ? a2 - 87 : -1;
}
function readName(source, start, line, col, prev) {
  var body = source.body;
  var bodyLength = body.length;
  var position = start + 1;
  var code = 0;
  while (position !== bodyLength && !isNaN(code = body.charCodeAt(position)) && (code === 95 || code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122)) {
    ++position;
  }
  return new Token(TokenKind.NAME, start, position, line, col, prev, body.slice(start, position));
}
function isNameStart(code) {
  return code === 95 || code >= 65 && code <= 90 || code >= 97 && code <= 122;
}
function parse(source, options2) {
  var parser = new Parser(source, options2);
  return parser.parseDocument();
}
var Parser = /* @__PURE__ */ function() {
  function Parser2(source, options2) {
    var sourceObj = isSource(source) ? source : new Source(source);
    this._lexer = new Lexer(sourceObj);
    this._options = options2;
  }
  var _proto = Parser2.prototype;
  _proto.parseName = function parseName() {
    var token = this.expectToken(TokenKind.NAME);
    return {
      kind: Kind.NAME,
      value: token.value,
      loc: this.loc(token)
    };
  };
  _proto.parseDocument = function parseDocument() {
    var start = this._lexer.token;
    return {
      kind: Kind.DOCUMENT,
      definitions: this.many(TokenKind.SOF, this.parseDefinition, TokenKind.EOF),
      loc: this.loc(start)
    };
  };
  _proto.parseDefinition = function parseDefinition() {
    if (this.peek(TokenKind.NAME)) {
      switch (this._lexer.token.value) {
        case "query":
        case "mutation":
        case "subscription":
          return this.parseOperationDefinition();
        case "fragment":
          return this.parseFragmentDefinition();
        case "schema":
        case "scalar":
        case "type":
        case "interface":
        case "union":
        case "enum":
        case "input":
        case "directive":
          return this.parseTypeSystemDefinition();
        case "extend":
          return this.parseTypeSystemExtension();
      }
    } else if (this.peek(TokenKind.BRACE_L)) {
      return this.parseOperationDefinition();
    } else if (this.peekDescription()) {
      return this.parseTypeSystemDefinition();
    }
    throw this.unexpected();
  };
  _proto.parseOperationDefinition = function parseOperationDefinition() {
    var start = this._lexer.token;
    if (this.peek(TokenKind.BRACE_L)) {
      return {
        kind: Kind.OPERATION_DEFINITION,
        operation: "query",
        name: void 0,
        variableDefinitions: [],
        directives: [],
        selectionSet: this.parseSelectionSet(),
        loc: this.loc(start)
      };
    }
    var operation = this.parseOperationType();
    var name;
    if (this.peek(TokenKind.NAME)) {
      name = this.parseName();
    }
    return {
      kind: Kind.OPERATION_DEFINITION,
      operation,
      name,
      variableDefinitions: this.parseVariableDefinitions(),
      directives: this.parseDirectives(false),
      selectionSet: this.parseSelectionSet(),
      loc: this.loc(start)
    };
  };
  _proto.parseOperationType = function parseOperationType() {
    var operationToken = this.expectToken(TokenKind.NAME);
    switch (operationToken.value) {
      case "query":
        return "query";
      case "mutation":
        return "mutation";
      case "subscription":
        return "subscription";
    }
    throw this.unexpected(operationToken);
  };
  _proto.parseVariableDefinitions = function parseVariableDefinitions() {
    return this.optionalMany(TokenKind.PAREN_L, this.parseVariableDefinition, TokenKind.PAREN_R);
  };
  _proto.parseVariableDefinition = function parseVariableDefinition() {
    var start = this._lexer.token;
    return {
      kind: Kind.VARIABLE_DEFINITION,
      variable: this.parseVariable(),
      type: (this.expectToken(TokenKind.COLON), this.parseTypeReference()),
      defaultValue: this.expectOptionalToken(TokenKind.EQUALS) ? this.parseValueLiteral(true) : void 0,
      directives: this.parseDirectives(true),
      loc: this.loc(start)
    };
  };
  _proto.parseVariable = function parseVariable() {
    var start = this._lexer.token;
    this.expectToken(TokenKind.DOLLAR);
    return {
      kind: Kind.VARIABLE,
      name: this.parseName(),
      loc: this.loc(start)
    };
  };
  _proto.parseSelectionSet = function parseSelectionSet() {
    var start = this._lexer.token;
    return {
      kind: Kind.SELECTION_SET,
      selections: this.many(TokenKind.BRACE_L, this.parseSelection, TokenKind.BRACE_R),
      loc: this.loc(start)
    };
  };
  _proto.parseSelection = function parseSelection() {
    return this.peek(TokenKind.SPREAD) ? this.parseFragment() : this.parseField();
  };
  _proto.parseField = function parseField() {
    var start = this._lexer.token;
    var nameOrAlias = this.parseName();
    var alias;
    var name;
    if (this.expectOptionalToken(TokenKind.COLON)) {
      alias = nameOrAlias;
      name = this.parseName();
    } else {
      name = nameOrAlias;
    }
    return {
      kind: Kind.FIELD,
      alias,
      name,
      arguments: this.parseArguments(false),
      directives: this.parseDirectives(false),
      selectionSet: this.peek(TokenKind.BRACE_L) ? this.parseSelectionSet() : void 0,
      loc: this.loc(start)
    };
  };
  _proto.parseArguments = function parseArguments(isConst) {
    var item = isConst ? this.parseConstArgument : this.parseArgument;
    return this.optionalMany(TokenKind.PAREN_L, item, TokenKind.PAREN_R);
  };
  _proto.parseArgument = function parseArgument() {
    var start = this._lexer.token;
    var name = this.parseName();
    this.expectToken(TokenKind.COLON);
    return {
      kind: Kind.ARGUMENT,
      name,
      value: this.parseValueLiteral(false),
      loc: this.loc(start)
    };
  };
  _proto.parseConstArgument = function parseConstArgument() {
    var start = this._lexer.token;
    return {
      kind: Kind.ARGUMENT,
      name: this.parseName(),
      value: (this.expectToken(TokenKind.COLON), this.parseValueLiteral(true)),
      loc: this.loc(start)
    };
  };
  _proto.parseFragment = function parseFragment() {
    var start = this._lexer.token;
    this.expectToken(TokenKind.SPREAD);
    var hasTypeCondition = this.expectOptionalKeyword("on");
    if (!hasTypeCondition && this.peek(TokenKind.NAME)) {
      return {
        kind: Kind.FRAGMENT_SPREAD,
        name: this.parseFragmentName(),
        directives: this.parseDirectives(false),
        loc: this.loc(start)
      };
    }
    return {
      kind: Kind.INLINE_FRAGMENT,
      typeCondition: hasTypeCondition ? this.parseNamedType() : void 0,
      directives: this.parseDirectives(false),
      selectionSet: this.parseSelectionSet(),
      loc: this.loc(start)
    };
  };
  _proto.parseFragmentDefinition = function parseFragmentDefinition() {
    var _this$_options;
    var start = this._lexer.token;
    this.expectKeyword("fragment");
    if (((_this$_options = this._options) === null || _this$_options === void 0 ? void 0 : _this$_options.experimentalFragmentVariables) === true) {
      return {
        kind: Kind.FRAGMENT_DEFINITION,
        name: this.parseFragmentName(),
        variableDefinitions: this.parseVariableDefinitions(),
        typeCondition: (this.expectKeyword("on"), this.parseNamedType()),
        directives: this.parseDirectives(false),
        selectionSet: this.parseSelectionSet(),
        loc: this.loc(start)
      };
    }
    return {
      kind: Kind.FRAGMENT_DEFINITION,
      name: this.parseFragmentName(),
      typeCondition: (this.expectKeyword("on"), this.parseNamedType()),
      directives: this.parseDirectives(false),
      selectionSet: this.parseSelectionSet(),
      loc: this.loc(start)
    };
  };
  _proto.parseFragmentName = function parseFragmentName() {
    if (this._lexer.token.value === "on") {
      throw this.unexpected();
    }
    return this.parseName();
  };
  _proto.parseValueLiteral = function parseValueLiteral(isConst) {
    var token = this._lexer.token;
    switch (token.kind) {
      case TokenKind.BRACKET_L:
        return this.parseList(isConst);
      case TokenKind.BRACE_L:
        return this.parseObject(isConst);
      case TokenKind.INT:
        this._lexer.advance();
        return {
          kind: Kind.INT,
          value: token.value,
          loc: this.loc(token)
        };
      case TokenKind.FLOAT:
        this._lexer.advance();
        return {
          kind: Kind.FLOAT,
          value: token.value,
          loc: this.loc(token)
        };
      case TokenKind.STRING:
      case TokenKind.BLOCK_STRING:
        return this.parseStringLiteral();
      case TokenKind.NAME:
        this._lexer.advance();
        switch (token.value) {
          case "true":
            return {
              kind: Kind.BOOLEAN,
              value: true,
              loc: this.loc(token)
            };
          case "false":
            return {
              kind: Kind.BOOLEAN,
              value: false,
              loc: this.loc(token)
            };
          case "null":
            return {
              kind: Kind.NULL,
              loc: this.loc(token)
            };
          default:
            return {
              kind: Kind.ENUM,
              value: token.value,
              loc: this.loc(token)
            };
        }
      case TokenKind.DOLLAR:
        if (!isConst) {
          return this.parseVariable();
        }
        break;
    }
    throw this.unexpected();
  };
  _proto.parseStringLiteral = function parseStringLiteral() {
    var token = this._lexer.token;
    this._lexer.advance();
    return {
      kind: Kind.STRING,
      value: token.value,
      block: token.kind === TokenKind.BLOCK_STRING,
      loc: this.loc(token)
    };
  };
  _proto.parseList = function parseList(isConst) {
    var _this = this;
    var start = this._lexer.token;
    var item = function item2() {
      return _this.parseValueLiteral(isConst);
    };
    return {
      kind: Kind.LIST,
      values: this.any(TokenKind.BRACKET_L, item, TokenKind.BRACKET_R),
      loc: this.loc(start)
    };
  };
  _proto.parseObject = function parseObject(isConst) {
    var _this2 = this;
    var start = this._lexer.token;
    var item = function item2() {
      return _this2.parseObjectField(isConst);
    };
    return {
      kind: Kind.OBJECT,
      fields: this.any(TokenKind.BRACE_L, item, TokenKind.BRACE_R),
      loc: this.loc(start)
    };
  };
  _proto.parseObjectField = function parseObjectField(isConst) {
    var start = this._lexer.token;
    var name = this.parseName();
    this.expectToken(TokenKind.COLON);
    return {
      kind: Kind.OBJECT_FIELD,
      name,
      value: this.parseValueLiteral(isConst),
      loc: this.loc(start)
    };
  };
  _proto.parseDirectives = function parseDirectives(isConst) {
    var directives = [];
    while (this.peek(TokenKind.AT)) {
      directives.push(this.parseDirective(isConst));
    }
    return directives;
  };
  _proto.parseDirective = function parseDirective(isConst) {
    var start = this._lexer.token;
    this.expectToken(TokenKind.AT);
    return {
      kind: Kind.DIRECTIVE,
      name: this.parseName(),
      arguments: this.parseArguments(isConst),
      loc: this.loc(start)
    };
  };
  _proto.parseTypeReference = function parseTypeReference() {
    var start = this._lexer.token;
    var type;
    if (this.expectOptionalToken(TokenKind.BRACKET_L)) {
      type = this.parseTypeReference();
      this.expectToken(TokenKind.BRACKET_R);
      type = {
        kind: Kind.LIST_TYPE,
        type,
        loc: this.loc(start)
      };
    } else {
      type = this.parseNamedType();
    }
    if (this.expectOptionalToken(TokenKind.BANG)) {
      return {
        kind: Kind.NON_NULL_TYPE,
        type,
        loc: this.loc(start)
      };
    }
    return type;
  };
  _proto.parseNamedType = function parseNamedType() {
    var start = this._lexer.token;
    return {
      kind: Kind.NAMED_TYPE,
      name: this.parseName(),
      loc: this.loc(start)
    };
  };
  _proto.parseTypeSystemDefinition = function parseTypeSystemDefinition() {
    var keywordToken = this.peekDescription() ? this._lexer.lookahead() : this._lexer.token;
    if (keywordToken.kind === TokenKind.NAME) {
      switch (keywordToken.value) {
        case "schema":
          return this.parseSchemaDefinition();
        case "scalar":
          return this.parseScalarTypeDefinition();
        case "type":
          return this.parseObjectTypeDefinition();
        case "interface":
          return this.parseInterfaceTypeDefinition();
        case "union":
          return this.parseUnionTypeDefinition();
        case "enum":
          return this.parseEnumTypeDefinition();
        case "input":
          return this.parseInputObjectTypeDefinition();
        case "directive":
          return this.parseDirectiveDefinition();
      }
    }
    throw this.unexpected(keywordToken);
  };
  _proto.peekDescription = function peekDescription() {
    return this.peek(TokenKind.STRING) || this.peek(TokenKind.BLOCK_STRING);
  };
  _proto.parseDescription = function parseDescription() {
    if (this.peekDescription()) {
      return this.parseStringLiteral();
    }
  };
  _proto.parseSchemaDefinition = function parseSchemaDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("schema");
    var directives = this.parseDirectives(true);
    var operationTypes = this.many(TokenKind.BRACE_L, this.parseOperationTypeDefinition, TokenKind.BRACE_R);
    return {
      kind: Kind.SCHEMA_DEFINITION,
      description,
      directives,
      operationTypes,
      loc: this.loc(start)
    };
  };
  _proto.parseOperationTypeDefinition = function parseOperationTypeDefinition() {
    var start = this._lexer.token;
    var operation = this.parseOperationType();
    this.expectToken(TokenKind.COLON);
    var type = this.parseNamedType();
    return {
      kind: Kind.OPERATION_TYPE_DEFINITION,
      operation,
      type,
      loc: this.loc(start)
    };
  };
  _proto.parseScalarTypeDefinition = function parseScalarTypeDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("scalar");
    var name = this.parseName();
    var directives = this.parseDirectives(true);
    return {
      kind: Kind.SCALAR_TYPE_DEFINITION,
      description,
      name,
      directives,
      loc: this.loc(start)
    };
  };
  _proto.parseObjectTypeDefinition = function parseObjectTypeDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("type");
    var name = this.parseName();
    var interfaces = this.parseImplementsInterfaces();
    var directives = this.parseDirectives(true);
    var fields = this.parseFieldsDefinition();
    return {
      kind: Kind.OBJECT_TYPE_DEFINITION,
      description,
      name,
      interfaces,
      directives,
      fields,
      loc: this.loc(start)
    };
  };
  _proto.parseImplementsInterfaces = function parseImplementsInterfaces() {
    var _this$_options2;
    if (!this.expectOptionalKeyword("implements")) {
      return [];
    }
    if (((_this$_options2 = this._options) === null || _this$_options2 === void 0 ? void 0 : _this$_options2.allowLegacySDLImplementsInterfaces) === true) {
      var types2 = [];
      this.expectOptionalToken(TokenKind.AMP);
      do {
        types2.push(this.parseNamedType());
      } while (this.expectOptionalToken(TokenKind.AMP) || this.peek(TokenKind.NAME));
      return types2;
    }
    return this.delimitedMany(TokenKind.AMP, this.parseNamedType);
  };
  _proto.parseFieldsDefinition = function parseFieldsDefinition() {
    var _this$_options3;
    if (((_this$_options3 = this._options) === null || _this$_options3 === void 0 ? void 0 : _this$_options3.allowLegacySDLEmptyFields) === true && this.peek(TokenKind.BRACE_L) && this._lexer.lookahead().kind === TokenKind.BRACE_R) {
      this._lexer.advance();
      this._lexer.advance();
      return [];
    }
    return this.optionalMany(TokenKind.BRACE_L, this.parseFieldDefinition, TokenKind.BRACE_R);
  };
  _proto.parseFieldDefinition = function parseFieldDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    var name = this.parseName();
    var args = this.parseArgumentDefs();
    this.expectToken(TokenKind.COLON);
    var type = this.parseTypeReference();
    var directives = this.parseDirectives(true);
    return {
      kind: Kind.FIELD_DEFINITION,
      description,
      name,
      arguments: args,
      type,
      directives,
      loc: this.loc(start)
    };
  };
  _proto.parseArgumentDefs = function parseArgumentDefs() {
    return this.optionalMany(TokenKind.PAREN_L, this.parseInputValueDef, TokenKind.PAREN_R);
  };
  _proto.parseInputValueDef = function parseInputValueDef() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    var name = this.parseName();
    this.expectToken(TokenKind.COLON);
    var type = this.parseTypeReference();
    var defaultValue;
    if (this.expectOptionalToken(TokenKind.EQUALS)) {
      defaultValue = this.parseValueLiteral(true);
    }
    var directives = this.parseDirectives(true);
    return {
      kind: Kind.INPUT_VALUE_DEFINITION,
      description,
      name,
      type,
      defaultValue,
      directives,
      loc: this.loc(start)
    };
  };
  _proto.parseInterfaceTypeDefinition = function parseInterfaceTypeDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("interface");
    var name = this.parseName();
    var interfaces = this.parseImplementsInterfaces();
    var directives = this.parseDirectives(true);
    var fields = this.parseFieldsDefinition();
    return {
      kind: Kind.INTERFACE_TYPE_DEFINITION,
      description,
      name,
      interfaces,
      directives,
      fields,
      loc: this.loc(start)
    };
  };
  _proto.parseUnionTypeDefinition = function parseUnionTypeDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("union");
    var name = this.parseName();
    var directives = this.parseDirectives(true);
    var types2 = this.parseUnionMemberTypes();
    return {
      kind: Kind.UNION_TYPE_DEFINITION,
      description,
      name,
      directives,
      types: types2,
      loc: this.loc(start)
    };
  };
  _proto.parseUnionMemberTypes = function parseUnionMemberTypes() {
    return this.expectOptionalToken(TokenKind.EQUALS) ? this.delimitedMany(TokenKind.PIPE, this.parseNamedType) : [];
  };
  _proto.parseEnumTypeDefinition = function parseEnumTypeDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("enum");
    var name = this.parseName();
    var directives = this.parseDirectives(true);
    var values = this.parseEnumValuesDefinition();
    return {
      kind: Kind.ENUM_TYPE_DEFINITION,
      description,
      name,
      directives,
      values,
      loc: this.loc(start)
    };
  };
  _proto.parseEnumValuesDefinition = function parseEnumValuesDefinition() {
    return this.optionalMany(TokenKind.BRACE_L, this.parseEnumValueDefinition, TokenKind.BRACE_R);
  };
  _proto.parseEnumValueDefinition = function parseEnumValueDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    var name = this.parseName();
    var directives = this.parseDirectives(true);
    return {
      kind: Kind.ENUM_VALUE_DEFINITION,
      description,
      name,
      directives,
      loc: this.loc(start)
    };
  };
  _proto.parseInputObjectTypeDefinition = function parseInputObjectTypeDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("input");
    var name = this.parseName();
    var directives = this.parseDirectives(true);
    var fields = this.parseInputFieldsDefinition();
    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      description,
      name,
      directives,
      fields,
      loc: this.loc(start)
    };
  };
  _proto.parseInputFieldsDefinition = function parseInputFieldsDefinition() {
    return this.optionalMany(TokenKind.BRACE_L, this.parseInputValueDef, TokenKind.BRACE_R);
  };
  _proto.parseTypeSystemExtension = function parseTypeSystemExtension() {
    var keywordToken = this._lexer.lookahead();
    if (keywordToken.kind === TokenKind.NAME) {
      switch (keywordToken.value) {
        case "schema":
          return this.parseSchemaExtension();
        case "scalar":
          return this.parseScalarTypeExtension();
        case "type":
          return this.parseObjectTypeExtension();
        case "interface":
          return this.parseInterfaceTypeExtension();
        case "union":
          return this.parseUnionTypeExtension();
        case "enum":
          return this.parseEnumTypeExtension();
        case "input":
          return this.parseInputObjectTypeExtension();
      }
    }
    throw this.unexpected(keywordToken);
  };
  _proto.parseSchemaExtension = function parseSchemaExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("schema");
    var directives = this.parseDirectives(true);
    var operationTypes = this.optionalMany(TokenKind.BRACE_L, this.parseOperationTypeDefinition, TokenKind.BRACE_R);
    if (directives.length === 0 && operationTypes.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.SCHEMA_EXTENSION,
      directives,
      operationTypes,
      loc: this.loc(start)
    };
  };
  _proto.parseScalarTypeExtension = function parseScalarTypeExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("scalar");
    var name = this.parseName();
    var directives = this.parseDirectives(true);
    if (directives.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.SCALAR_TYPE_EXTENSION,
      name,
      directives,
      loc: this.loc(start)
    };
  };
  _proto.parseObjectTypeExtension = function parseObjectTypeExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("type");
    var name = this.parseName();
    var interfaces = this.parseImplementsInterfaces();
    var directives = this.parseDirectives(true);
    var fields = this.parseFieldsDefinition();
    if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.OBJECT_TYPE_EXTENSION,
      name,
      interfaces,
      directives,
      fields,
      loc: this.loc(start)
    };
  };
  _proto.parseInterfaceTypeExtension = function parseInterfaceTypeExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("interface");
    var name = this.parseName();
    var interfaces = this.parseImplementsInterfaces();
    var directives = this.parseDirectives(true);
    var fields = this.parseFieldsDefinition();
    if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.INTERFACE_TYPE_EXTENSION,
      name,
      interfaces,
      directives,
      fields,
      loc: this.loc(start)
    };
  };
  _proto.parseUnionTypeExtension = function parseUnionTypeExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("union");
    var name = this.parseName();
    var directives = this.parseDirectives(true);
    var types2 = this.parseUnionMemberTypes();
    if (directives.length === 0 && types2.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.UNION_TYPE_EXTENSION,
      name,
      directives,
      types: types2,
      loc: this.loc(start)
    };
  };
  _proto.parseEnumTypeExtension = function parseEnumTypeExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("enum");
    var name = this.parseName();
    var directives = this.parseDirectives(true);
    var values = this.parseEnumValuesDefinition();
    if (directives.length === 0 && values.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.ENUM_TYPE_EXTENSION,
      name,
      directives,
      values,
      loc: this.loc(start)
    };
  };
  _proto.parseInputObjectTypeExtension = function parseInputObjectTypeExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("input");
    var name = this.parseName();
    var directives = this.parseDirectives(true);
    var fields = this.parseInputFieldsDefinition();
    if (directives.length === 0 && fields.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.INPUT_OBJECT_TYPE_EXTENSION,
      name,
      directives,
      fields,
      loc: this.loc(start)
    };
  };
  _proto.parseDirectiveDefinition = function parseDirectiveDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("directive");
    this.expectToken(TokenKind.AT);
    var name = this.parseName();
    var args = this.parseArgumentDefs();
    var repeatable = this.expectOptionalKeyword("repeatable");
    this.expectKeyword("on");
    var locations = this.parseDirectiveLocations();
    return {
      kind: Kind.DIRECTIVE_DEFINITION,
      description,
      name,
      arguments: args,
      repeatable,
      locations,
      loc: this.loc(start)
    };
  };
  _proto.parseDirectiveLocations = function parseDirectiveLocations() {
    return this.delimitedMany(TokenKind.PIPE, this.parseDirectiveLocation);
  };
  _proto.parseDirectiveLocation = function parseDirectiveLocation() {
    var start = this._lexer.token;
    var name = this.parseName();
    if (DirectiveLocation[name.value] !== void 0) {
      return name;
    }
    throw this.unexpected(start);
  };
  _proto.loc = function loc(startToken) {
    var _this$_options4;
    if (((_this$_options4 = this._options) === null || _this$_options4 === void 0 ? void 0 : _this$_options4.noLocation) !== true) {
      return new Location(startToken, this._lexer.lastToken, this._lexer.source);
    }
  };
  _proto.peek = function peek(kind) {
    return this._lexer.token.kind === kind;
  };
  _proto.expectToken = function expectToken(kind) {
    var token = this._lexer.token;
    if (token.kind === kind) {
      this._lexer.advance();
      return token;
    }
    throw syntaxError(this._lexer.source, token.start, "Expected ".concat(getTokenKindDesc(kind), ", found ").concat(getTokenDesc(token), "."));
  };
  _proto.expectOptionalToken = function expectOptionalToken(kind) {
    var token = this._lexer.token;
    if (token.kind === kind) {
      this._lexer.advance();
      return token;
    }
    return void 0;
  };
  _proto.expectKeyword = function expectKeyword(value) {
    var token = this._lexer.token;
    if (token.kind === TokenKind.NAME && token.value === value) {
      this._lexer.advance();
    } else {
      throw syntaxError(this._lexer.source, token.start, 'Expected "'.concat(value, '", found ').concat(getTokenDesc(token), "."));
    }
  };
  _proto.expectOptionalKeyword = function expectOptionalKeyword(value) {
    var token = this._lexer.token;
    if (token.kind === TokenKind.NAME && token.value === value) {
      this._lexer.advance();
      return true;
    }
    return false;
  };
  _proto.unexpected = function unexpected(atToken) {
    var token = atToken !== null && atToken !== void 0 ? atToken : this._lexer.token;
    return syntaxError(this._lexer.source, token.start, "Unexpected ".concat(getTokenDesc(token), "."));
  };
  _proto.any = function any(openKind, parseFn, closeKind) {
    this.expectToken(openKind);
    var nodes = [];
    while (!this.expectOptionalToken(closeKind)) {
      nodes.push(parseFn.call(this));
    }
    return nodes;
  };
  _proto.optionalMany = function optionalMany(openKind, parseFn, closeKind) {
    if (this.expectOptionalToken(openKind)) {
      var nodes = [];
      do {
        nodes.push(parseFn.call(this));
      } while (!this.expectOptionalToken(closeKind));
      return nodes;
    }
    return [];
  };
  _proto.many = function many(openKind, parseFn, closeKind) {
    this.expectToken(openKind);
    var nodes = [];
    do {
      nodes.push(parseFn.call(this));
    } while (!this.expectOptionalToken(closeKind));
    return nodes;
  };
  _proto.delimitedMany = function delimitedMany(delimiterKind, parseFn) {
    this.expectOptionalToken(delimiterKind);
    var nodes = [];
    do {
      nodes.push(parseFn.call(this));
    } while (this.expectOptionalToken(delimiterKind));
    return nodes;
  };
  return Parser2;
}();
function getTokenDesc(token) {
  var value = token.value;
  return getTokenKindDesc(token.kind) + (value != null ? ' "'.concat(value, '"') : "");
}
function getTokenKindDesc(kind) {
  return isPunctuatorTokenKind(kind) ? '"'.concat(kind, '"') : kind;
}
function l$1(a2, b2) {
  b2.tag = a2;
  return b2;
}
function m$1() {
}
function p$1(a2) {
  return function(b2) {
    var c2 = a2.length;
    let d2 = false, e2 = false, f2 = false, g2 = 0;
    b2(l$1(0, [
      function(h2) {
        if (h2) {
          d2 = true;
        } else if (e2) {
          f2 = true;
        } else {
          for (e2 = f2 = true; f2 && !d2; ) {
            g2 < c2 ? (h2 = a2[g2], g2 = g2 + 1 | 0, f2 = false, b2(l$1(1, [h2]))) : (d2 = true, b2(0));
          }
          e2 = false;
        }
      }
    ]));
  };
}
function r$1() {
}
function t$1(a2) {
  a2(0);
}
function u$2(a2) {
  let b2 = false;
  a2(l$1(0, [
    function(c2) {
      c2 ? b2 = true : b2 || a2(0);
    }
  ]));
}
function x$1(a2) {
  if (a2 === null || a2[0] !== v$1) {
    return a2;
  }
  if ((a2 = a2[1]) !== 0) {
    return [v$1, a2 - 1 | 0];
  }
}
function z$1(a2) {
  return function(b2) {
    return function(c2) {
      function d2(b3) {
        typeof b3 == "number" ? k2 && (k2 = false, (b3 = e2.shift()) !== void 0 ? (b3 = a2(x$1(b3)), k2 = true, b3(d2)) : q ? c2(0) : g2 || (g2 = true, f2(0))) : b3.tag ? k2 && (c2(b3), n2 ? n2 = false : h2(0)) : (h2 = b3 = b3[0], n2 = false, b3(0));
      }
      let e2 = [], f2 = m$1, g2 = false, h2 = m$1, k2 = false, n2 = false, q = false;
      b2(function(b3) {
        typeof b3 == "number" ? q || (q = true, k2 || e2.length !== 0 || c2(0)) : b3.tag ? q || (b3 = b3[0], g2 = false, k2 ? e2.push(b3) : (b3 = a2(b3), k2 = true, b3(d2))) : f2 = b3[0];
      });
      c2(l$1(0, [
        function(c3) {
          if (c3) {
            if (q || (q = true, f2(1)), k2) {
              return k2 = false, h2(1);
            }
          } else {
            q || g2 || (g2 = true, f2(0)), k2 && !n2 && (n2 = true, h2(0));
          }
        }
      ]));
    };
  };
}
function B$1(a2) {
  return a2;
}
function C$1(a2) {
  return a2(0);
}
function D(a2) {
  return function(b2) {
    return function(c2) {
      let e2 = m$1, f2 = false, g2 = [], h2 = false;
      b2(function(b3) {
        typeof b3 == "number" ? h2 || (h2 = true, g2.length === 0 && c2(0)) : b3.tag ? h2 || (f2 = false, function(a3) {
          function b4(a4) {
            typeof a4 == "number" ? g2.length !== 0 && (g2 = g2.filter(d2), a4 = g2.length === 0, h2 && a4 ? c2(0) : !f2 && a4 && (f2 = true, e2(0))) : a4.tag ? g2.length !== 0 && (c2(l$1(1, [a4[0]])), k2(0)) : (k2 = a4 = a4[0], g2 = g2.concat(a4), a4(0));
          }
          function d2(a4) {
            return a4 !== k2;
          }
          let k2 = m$1;
          a3.length === 1 ? a3(b4) : a3.bind(null, b4);
        }(a2(b3[0])), f2 || (f2 = true, e2(0))) : e2 = b3[0];
      });
      c2(l$1(0, [
        function(a3) {
          a3 ? (h2 || (h2 = true, e2(a3)), g2.forEach(function(c3) {
            return c3(a3);
          }), g2 = []) : (f2 || h2 ? f2 = false : (f2 = true, e2(0)), g2.forEach(C$1));
        }
      ]));
    };
  };
}
function E$1(a2) {
  return a2;
}
function H(a2) {
  return function(b2) {
    return function(c2) {
      let d2 = false;
      return b2(function(e2) {
        if (typeof e2 == "number") {
          d2 || (d2 = true, c2(e2));
        } else if (e2.tag) {
          d2 || (a2(e2[0]), c2(e2));
        } else {
          var g2 = e2[0];
          c2(l$1(0, [
            function(a3) {
              if (!d2) {
                return a3 && (d2 = true), g2(a3);
              }
            }
          ]));
        }
      });
    };
  };
}
function J(a2) {
  a2(0);
}
function K(a2) {
  return function(b2) {
    return function(c2) {
      function d2(a3) {
        h2 && (typeof a3 == "number" ? (h2 = false, n2 ? c2(a3) : f2 || (f2 = true, e2(0))) : a3.tag ? (c2(a3), k2 ? k2 = false : g2(0)) : (g2 = a3 = a3[0], k2 = false, a3(0)));
      }
      let e2 = m$1, f2 = false, g2 = m$1, h2 = false, k2 = false, n2 = false;
      b2(function(b3) {
        typeof b3 == "number" ? n2 || (n2 = true, h2 || c2(0)) : b3.tag ? n2 || (h2 && (g2(1), g2 = m$1), f2 ? f2 = false : (f2 = true, e2(0)), b3 = a2(b3[0]), h2 = true, b3(d2)) : e2 = b3[0];
      });
      c2(l$1(0, [
        function(a3) {
          if (a3) {
            if (n2 || (n2 = true, e2(1)), h2) {
              return h2 = false, g2(1);
            }
          } else {
            n2 || f2 || (f2 = true, e2(0)), h2 && !k2 && (k2 = true, g2(0));
          }
        }
      ]));
    };
  };
}
function M$1(a2) {
  return function(b2) {
    return function(c2) {
      let d2 = [], e2 = m$1;
      return b2(function(b3) {
        typeof b3 == "number" ? p$1(d2)(c2) : b3.tag ? (d2.length >= a2 && 0 < a2 && d2.shift(), d2.push(b3[0]), e2(0)) : (b3 = b3[0], 0 >= a2 ? (b3(1), u$2(c2)) : (e2 = b3, b3(0)));
      });
    };
  };
}
function N(a2) {
  return function(b2) {
    let c2 = m$1, d2 = false;
    b2(function(e2) {
      typeof e2 == "number" ? d2 = true : e2.tag ? d2 || (a2(e2[0]), c2(0)) : (c2 = e2 = e2[0], e2(0));
    });
    return {
      unsubscribe: function() {
        if (!d2) {
          return d2 = true, c2(1);
        }
      }
    };
  };
}
function O() {
}
function concat$1(a2) {
  return z$1(B$1)(p$1(a2));
}
function filter$1(a2) {
  return function(b2) {
    return function(c2) {
      let d2 = m$1;
      return b2(function(b3) {
        typeof b3 == "number" ? c2(b3) : b3.tag ? a2(b3[0]) ? c2(b3) : d2(0) : (d2 = b3[0], c2(b3));
      });
    };
  };
}
function fromValue$1(a2) {
  return function(b2) {
    let c2 = false;
    b2(l$1(0, [
      function(d2) {
        d2 ? c2 = true : c2 || (c2 = true, b2(l$1(1, [a2])), b2(0));
      }
    ]));
  };
}
function make$1(a2) {
  return function(b2) {
    let c2 = r$1, d2 = false;
    c2 = a2({
      next: function(a3) {
        d2 || b2(l$1(1, [a3]));
      },
      complete: function() {
        d2 || (d2 = true, b2(0));
      }
    });
    b2(l$1(0, [
      function(a3) {
        if (a3 && !d2) {
          return d2 = true, c2();
        }
      }
    ]));
  };
}
function makeSubject$1() {
  let a2 = [], b2 = false;
  return {
    source: function(c2) {
      function b3(a3) {
        return a3 !== c2;
      }
      a2 = a2.concat(c2);
      c2(l$1(0, [
        function(c3) {
          c3 && (a2 = a2.filter(b3));
        }
      ]));
    },
    next: function(c2) {
      b2 || a2.forEach(function(a3) {
        a3(l$1(1, [c2]));
      });
    },
    complete: function() {
      b2 || (b2 = true, a2.forEach(t$1));
    }
  };
}
function map$1(a2) {
  return function(b2) {
    return function(c2) {
      return b2(function(b3) {
        b3 = typeof b3 == "number" ? 0 : b3.tag ? l$1(1, [a2(b3[0])]) : l$1(0, [b3[0]]);
        c2(b3);
      });
    };
  };
}
function merge$1(a2) {
  return D(E$1)(p$1(a2));
}
function onEnd$1(a2) {
  return function(b2) {
    return function(c2) {
      let d2 = false;
      return b2(function(b3) {
        if (typeof b3 == "number") {
          if (d2) {
            return;
          }
          d2 = true;
          c2(b3);
          return a2();
        }
        if (b3.tag) {
          d2 || c2(b3);
        } else {
          var e2 = b3[0];
          c2(l$1(0, [
            function(c3) {
              if (!d2) {
                return c3 ? (d2 = true, e2(c3), a2()) : e2(c3);
              }
            }
          ]));
        }
      });
    };
  };
}
function onStart$1(a2) {
  return function(b2) {
    return function(c2) {
      return b2(function(b3) {
        typeof b3 == "number" ? c2(b3) : b3.tag ? c2(b3) : (c2(b3), a2());
      });
    };
  };
}
function publish$1(a2) {
  return N(O)(a2);
}
function scan$1(a2, b2) {
  return function(a3, b3) {
    return function(c2) {
      return function(d2) {
        let e2 = b3;
        return c2(function(c3) {
          typeof c3 == "number" ? c3 = 0 : c3.tag ? (e2 = a3(e2, c3[0]), c3 = l$1(1, [e2])) : c3 = l$1(0, [c3[0]]);
          d2(c3);
        });
      };
    };
  }(a2, b2);
}
function share$1(a2) {
  function b2(a3) {
    typeof a3 == "number" ? (c2.forEach(J), c2 = []) : a3.tag ? (e2 = false, c2.forEach(function(b3) {
      b3(a3);
    })) : d2 = a3[0];
  }
  let c2 = [], d2 = m$1, e2 = false;
  return function(f2) {
    function g2(a3) {
      return a3 !== f2;
    }
    c2 = c2.concat(f2);
    c2.length === 1 && a2(b2);
    f2(l$1(0, [
      function(a3) {
        if (a3) {
          if (c2 = c2.filter(g2), c2.length === 0) {
            return d2(1);
          }
        } else {
          e2 || (e2 = true, d2(a3));
        }
      }
    ]));
  };
}
function take$1(a2) {
  return function(b2) {
    return function(c2) {
      let d2 = false, e2 = 0, f2 = m$1;
      b2(function(b3) {
        typeof b3 == "number" ? d2 || (d2 = true, c2(0)) : b3.tag ? e2 < a2 && !d2 && (e2 = e2 + 1 | 0, c2(b3), !d2 && e2 >= a2 && (d2 = true, c2(0), f2(1))) : (b3 = b3[0], 0 >= a2 ? (d2 = true, c2(0), b3(1)) : f2 = b3);
      });
      c2(l$1(0, [
        function(b3) {
          if (!d2) {
            if (b3) {
              return d2 = true, f2(1);
            }
            if (e2 < a2) {
              return f2(0);
            }
          }
        }
      ]));
    };
  };
}
function takeUntil$1(a2) {
  return function(b2) {
    return function(c2) {
      function d2(a3) {
        typeof a3 != "number" && (a3.tag ? (e2 = true, f2(1), c2(0)) : (g2 = a3 = a3[0], a3(0)));
      }
      let e2 = false, f2 = m$1, g2 = m$1;
      b2(function(b3) {
        typeof b3 == "number" ? e2 || (e2 = true, g2(1), c2(0)) : b3.tag ? e2 || c2(b3) : (f2 = b3[0], a2(d2));
      });
      c2(l$1(0, [
        function(a3) {
          if (!e2) {
            return a3 ? (e2 = true, f2(1), g2(1)) : f2(0);
          }
        }
      ]));
    };
  };
}
function toPromise$1(a2) {
  return new Promise(function(b2) {
    M$1(1)(a2)(function(a3) {
      if (typeof a3 != "number") {
        if (a3.tag) {
          b2(a3[0]);
        } else {
          a3[0](0);
        }
      }
    });
  });
}
var v$1 = [];
typeof Symbol == "function" ? Symbol.observable || (Symbol.observable = Symbol("observable")) : "@@observable";
function rehydrateGraphQlError(r2) {
  if (typeof r2 == "string") {
    return new GraphQLError(r2);
  } else if (typeof r2 == "object" && r2.message) {
    return new GraphQLError(r2.message, r2.nodes, r2.source, r2.positions, r2.path, r2, r2.extensions || {});
  } else {
    return r2;
  }
}
var i$1 = function(e2) {
  function CombinedError(r2) {
    var t2 = r2.networkError;
    var n2 = r2.response;
    var o2 = (r2.graphQLErrors || []).map(rehydrateGraphQlError);
    var i2 = function generateErrorMessage(e3, r3) {
      var t3 = "";
      if (e3 !== void 0) {
        return t3 = "[Network] " + e3.message;
      }
      if (r3 !== void 0) {
        r3.forEach(function(e4) {
          t3 += "[GraphQL] " + e4.message + "\n";
        });
      }
      return t3.trim();
    }(t2, o2);
    e2.call(this, i2);
    this.name = "CombinedError";
    this.message = i2;
    this.graphQLErrors = o2;
    this.networkError = t2;
    this.response = n2;
  }
  if (e2) {
    CombinedError.__proto__ = e2;
  }
  (CombinedError.prototype = Object.create(e2 && e2.prototype)).constructor = CombinedError;
  CombinedError.prototype.toString = function toString() {
    return this.message;
  };
  return CombinedError;
}(Error);
function phash(e2, r2) {
  e2 |= 0;
  for (var t2 = 0, n2 = 0 | r2.length; t2 < n2; t2++) {
    e2 = (e2 << 5) + e2 + r2.charCodeAt(t2);
  }
  return e2;
}
function hash2(e2) {
  return phash(5381, e2) >>> 0;
}
var a$1 = new Set();
var s$12 = new WeakMap();
function stringify(e2) {
  if (e2 === null || a$1.has(e2)) {
    return "null";
  } else if (typeof e2 != "object") {
    return JSON.stringify(e2) || "";
  } else if (e2.toJSON) {
    return stringify(e2.toJSON());
  } else if (Array.isArray(e2)) {
    var r2 = "[";
    for (var t2 = 0, n2 = e2.length; t2 < n2; t2++) {
      if (t2 > 0) {
        r2 += ",";
      }
      var o2 = stringify(e2[t2]);
      r2 += o2.length > 0 ? o2 : "null";
    }
    return r2 += "]";
  }
  var i2 = Object.keys(e2).sort();
  if (!i2.length && e2.constructor && e2.constructor !== Object) {
    var u2 = s$12.get(e2) || Math.random().toString(36).slice(2);
    s$12.set(e2, u2);
    return '{"__key":"' + u2 + '"}';
  }
  a$1.add(e2);
  var f2 = "{";
  for (var c2 = 0, l2 = i2.length; c2 < l2; c2++) {
    var p2 = i2[c2];
    var h2 = stringify(e2[p2]);
    if (h2) {
      if (f2.length > 1) {
        f2 += ",";
      }
      f2 += stringify(p2) + ":" + h2;
    }
  }
  a$1.delete(e2);
  return f2 += "}";
}
function stringifyVariables(e2) {
  a$1.clear();
  return stringify(e2);
}
function stringifyDocument(e2) {
  var r2 = (typeof e2 != "string" ? e2.loc && e2.loc.source.body || print(e2) : e2).replace(/([\s,]|#[^\n\r]+)+/g, " ").trim();
  if (typeof e2 != "string") {
    var t2 = "definitions" in e2 && getOperationName(e2);
    if (t2) {
      r2 = "# " + t2 + "\n" + r2;
    }
    if (!e2.loc) {
      e2.loc = {
        start: 0,
        end: r2.length,
        source: {
          body: r2,
          name: "gql",
          locationOffset: {
            line: 1,
            column: 1
          }
        }
      };
    }
  }
  return r2;
}
var u$1 = new Map();
function keyDocument(e2) {
  var r2;
  var n2;
  if (typeof e2 == "string") {
    r2 = hash2(stringifyDocument(e2));
    n2 = u$1.get(r2) || parse(e2, {
      noLocation: true
    });
  } else {
    r2 = e2.__key || hash2(stringifyDocument(e2));
    n2 = u$1.get(r2) || e2;
  }
  if (!n2.loc) {
    stringifyDocument(n2);
  }
  n2.__key = r2;
  u$1.set(r2, n2);
  return n2;
}
function createRequest(e2, r2) {
  if (!r2) {
    r2 = {};
  }
  var t2 = keyDocument(e2);
  return {
    key: phash(t2.__key, stringifyVariables(r2)) >>> 0,
    query: t2,
    variables: r2
  };
}
function getOperationName(e2) {
  for (var t2 = 0, n2 = e2.definitions.length; t2 < n2; t2++) {
    var o2 = e2.definitions[t2];
    if (o2.kind === Kind.OPERATION_DEFINITION && o2.name) {
      return o2.name.value;
    }
  }
}
function makeResult(e2, r2, t2) {
  return {
    operation: e2,
    data: r2.data,
    error: Array.isArray(r2.errors) ? new i$1({
      graphQLErrors: r2.errors,
      response: t2
    }) : void 0,
    extensions: typeof r2.extensions == "object" && r2.extensions || void 0
  };
}
function makeErrorResult(e2, r2, t2) {
  return {
    operation: e2,
    data: void 0,
    error: new i$1({
      networkError: r2,
      response: t2
    }),
    extensions: void 0
  };
}
function _extends$2() {
  return (_extends$2 = Object.assign || function(e2) {
    for (var r2 = 1; r2 < arguments.length; r2++) {
      var t2 = arguments[r2];
      for (var n2 in t2) {
        if (Object.prototype.hasOwnProperty.call(t2, n2)) {
          e2[n2] = t2[n2];
        }
      }
    }
    return e2;
  }).apply(this, arguments);
}
function shouldUseGet(e2) {
  return e2.kind === "query" && !!e2.context.preferGetMethod;
}
function makeFetchBody(e2) {
  return {
    query: print(e2.query),
    operationName: getOperationName(e2.query),
    variables: e2.variables || void 0,
    extensions: void 0
  };
}
function makeFetchURL(e2, r2) {
  var t2 = shouldUseGet(e2);
  var n2 = e2.context.url;
  if (!t2 || !r2) {
    return n2;
  }
  var o2 = [];
  if (r2.operationName) {
    o2.push("operationName=" + encodeURIComponent(r2.operationName));
  }
  if (r2.query) {
    o2.push("query=" + encodeURIComponent(r2.query.replace(/([\s,]|#[^\n\r]+)+/g, " ").trim()));
  }
  if (r2.variables) {
    o2.push("variables=" + encodeURIComponent(stringifyVariables(r2.variables)));
  }
  if (r2.extensions) {
    o2.push("extensions=" + encodeURIComponent(stringifyVariables(r2.extensions)));
  }
  return n2 + "?" + o2.join("&");
}
function makeFetchOptions(e2, r2) {
  var t2 = shouldUseGet(e2);
  var n2 = typeof e2.context.fetchOptions == "function" ? e2.context.fetchOptions() : e2.context.fetchOptions || {};
  return _extends$2({}, n2, {
    body: !t2 && r2 ? JSON.stringify(r2) : void 0,
    method: t2 ? "GET" : "POST",
    headers: t2 ? n2.headers : _extends$2({}, {
      "content-type": "application/json"
    }, n2.headers)
  });
}
function makeFetchSource(e2, r2, t2) {
  return make$1(function(n2) {
    var o2 = n2.next;
    var i2 = n2.complete;
    var a2 = typeof AbortController != "undefined" ? new AbortController() : null;
    var s22 = false;
    Promise.resolve().then(function() {
      if (s22) {
        return;
      } else if (a2) {
        t2.signal = a2.signal;
      }
      return function executeFetch(e3, r3, t3) {
        var n3 = false;
        var o3;
        return (e3.context.fetch || fetch)(r3, t3).then(function(e4) {
          o3 = e4;
          n3 = e4.status < 200 || e4.status >= (t3.redirect === "manual" ? 400 : 300);
          return e4.json();
        }).then(function(r4) {
          if (!("data" in r4) && !("errors" in r4)) {
            throw new Error("No Content");
          }
          return makeResult(e3, r4, o3);
        }).catch(function(r4) {
          if (r4.name !== "AbortError") {
            return makeErrorResult(e3, n3 ? new Error(o3.statusText) : r4, o3);
          }
        });
      }(e2, r2, t2);
    }).then(function(e3) {
      if (!s22) {
        s22 = true;
        if (e3) {
          o2(e3);
        }
        i2();
      }
    });
    return function() {
      s22 = true;
      if (a2) {
        a2.abort();
      }
    };
  });
}
function collectTypes(e2, r2) {
  if (Array.isArray(e2)) {
    for (var n2 = 0; n2 < e2.length; n2++) {
      collectTypes(e2[n2], r2);
    }
  } else if (typeof e2 == "object" && e2 !== null) {
    for (var t2 in e2) {
      if (t2 === "__typename" && typeof e2[t2] == "string") {
        r2[e2[t2]] = 0;
      } else {
        collectTypes(e2[t2], r2);
      }
    }
  }
  return r2;
}
function collectTypesFromResponse(e2) {
  return Object.keys(collectTypes(e2, {}));
}
var formatNode = function(e2) {
  if (e2.selectionSet && !e2.selectionSet.selections.some(function(e3) {
    return e3.kind === Kind.FIELD && e3.name.value === "__typename" && !e3.alias;
  })) {
    return _extends$2({}, e2, {
      selectionSet: _extends$2({}, e2.selectionSet, {
        selections: e2.selectionSet.selections.concat([{
          kind: Kind.FIELD,
          name: {
            kind: Kind.NAME,
            value: "__typename"
          }
        }])
      })
    });
  }
};
var I$1 = new Map();
function formatDocument(r2) {
  var n2 = keyDocument(r2);
  var a2 = I$1.get(n2.__key);
  if (!a2) {
    (a2 = visit(n2, {
      Field: formatNode,
      InlineFragment: formatNode
    })).__key = n2.__key;
    I$1.set(n2.__key, a2);
  }
  return a2;
}
function maskTypename(e2) {
  if (!e2 || typeof e2 != "object") {
    return e2;
  }
  return Object.keys(e2).reduce(function(r2, n2) {
    var t2 = e2[n2];
    if (n2 === "__typename") {
      Object.defineProperty(r2, "__typename", {
        enumerable: false,
        value: t2
      });
    } else if (Array.isArray(t2)) {
      r2[n2] = t2.map(maskTypename);
    } else if (t2 && typeof t2 == "object" && "__typename" in t2) {
      r2[n2] = maskTypename(t2);
    } else {
      r2[n2] = t2;
    }
    return r2;
  }, {});
}
function withPromise(e2) {
  e2.toPromise = function() {
    return toPromise$1(take$1(1)(filter$1(function(e3) {
      return !e3.stale;
    })(e2)));
  };
  return e2;
}
function makeOperation(e2, r2, n2) {
  if (!n2) {
    n2 = r2.context;
  }
  return {
    key: r2.key,
    query: r2.query,
    variables: r2.variables,
    kind: e2,
    context: n2
  };
}
function addMetadata(e2, r2) {
  return makeOperation(e2.kind, e2, _extends$2({}, e2.context, {
    meta: _extends$2({}, e2.context.meta, r2)
  }));
}
function noop2() {
}
function applyDefinitions(e2, n2, t2) {
  for (var a2 = 0; a2 < t2.length; a2++) {
    if (t2[a2].kind === Kind.FRAGMENT_DEFINITION) {
      var o2 = t2[a2].name.value;
      var u2 = stringifyDocument(t2[a2]);
      if (!e2.has(o2)) {
        e2.set(o2, u2);
        n2.push(t2[a2]);
      }
    } else {
      n2.push(t2[a2]);
    }
  }
}
function gql() {
  var e2 = arguments;
  var n2 = new Map();
  var a2 = [];
  var o2 = [];
  var i2 = Array.isArray(arguments[0]) ? arguments[0][0] : arguments[0] || "";
  for (var u2 = 1; u2 < arguments.length; u2++) {
    var c2 = e2[u2];
    if (c2 && c2.definitions) {
      o2.push.apply(o2, c2.definitions);
    } else {
      i2 += c2;
    }
    i2 += e2[0][u2];
  }
  applyDefinitions(n2, a2, keyDocument(i2).definitions);
  applyDefinitions(n2, a2, o2);
  return keyDocument({
    kind: Kind.DOCUMENT,
    definitions: a2
  });
}
function shouldSkip(e2) {
  var r2 = e2.kind;
  return r2 !== "mutation" && r2 !== "query";
}
function cacheExchange(e2) {
  var r2 = e2.forward;
  var n2 = e2.client;
  e2.dispatchDebug;
  var a2 = new Map();
  var i2 = Object.create(null);
  function mapTypeNames(e3) {
    var r3 = makeOperation(e3.kind, e3);
    r3.query = formatDocument(e3.query);
    return r3;
  }
  function isOperationCached(e3) {
    var r3 = e3.context.requestPolicy;
    return e3.kind === "query" && r3 !== "network-only" && (r3 === "cache-only" || a2.has(e3.key));
  }
  return function(e3) {
    var u2 = share$1(e3);
    var c2 = map$1(function(e4) {
      var r3 = a2.get(e4.key);
      var i3 = _extends$2({}, r3, {
        operation: addMetadata(e4, {
          cacheOutcome: r3 ? "hit" : "miss"
        })
      });
      if (e4.context.requestPolicy === "cache-and-network") {
        i3.stale = true;
        reexecuteOperation(n2, e4);
      }
      return i3;
    })(filter$1(function(e4) {
      return !shouldSkip(e4) && isOperationCached(e4);
    })(u2));
    var s22 = H(function(e4) {
      var r3 = e4.operation;
      if (!r3) {
        return;
      }
      var o2 = collectTypesFromResponse(e4.data).concat(r3.context.additionalTypenames || []);
      if (e4.operation.kind === "mutation") {
        var u3 = new Set();
        for (var c3 = 0; c3 < o2.length; c3++) {
          var s3 = o2[c3];
          var f2 = i2[s3] || (i2[s3] = new Set());
          f2.forEach(function(e5) {
            u3.add(e5);
          });
          f2.clear();
        }
        u3.forEach(function(e5) {
          if (a2.has(e5)) {
            r3 = a2.get(e5).operation;
            a2.delete(e5);
            reexecuteOperation(n2, r3);
          }
        });
      } else if (r3.kind === "query" && e4.data) {
        a2.set(r3.key, e4);
        for (var p2 = 0; p2 < o2.length; p2++) {
          var l2 = o2[p2];
          (i2[l2] || (i2[l2] = new Set())).add(r3.key);
        }
      }
    })(r2(filter$1(function(e4) {
      return e4.kind !== "query" || e4.context.requestPolicy !== "cache-only";
    })(map$1(function(e4) {
      return addMetadata(e4, {
        cacheOutcome: "miss"
      });
    })(merge$1([map$1(mapTypeNames)(filter$1(function(e4) {
      return !shouldSkip(e4) && !isOperationCached(e4);
    })(u2)), filter$1(function(e4) {
      return shouldSkip(e4);
    })(u2)])))));
    return merge$1([c2, s22]);
  };
}
function reexecuteOperation(e2, r2) {
  return e2.reexecuteOperation(makeOperation(r2.kind, r2, _extends$2({}, r2.context, {
    requestPolicy: "network-only"
  })));
}
function dedupExchange(e2) {
  var r2 = e2.forward;
  e2.dispatchDebug;
  var t2 = new Set();
  function filterIncomingOperation(e3) {
    var r3 = e3.key;
    var a2 = e3.kind;
    if (a2 === "teardown") {
      t2.delete(r3);
      return true;
    }
    if (a2 !== "query" && a2 !== "subscription") {
      return true;
    }
    var o2 = t2.has(r3);
    t2.add(r3);
    return !o2;
  }
  function afterOperationResult(e3) {
    t2.delete(e3.operation.key);
  }
  return function(e3) {
    var n2 = filter$1(filterIncomingOperation)(e3);
    return H(afterOperationResult)(r2(n2));
  };
}
function fetchExchange(e2) {
  var r2 = e2.forward;
  e2.dispatchDebug;
  return function(e3) {
    var t2 = share$1(e3);
    var a2 = D(function(e4) {
      var r3 = e4.key;
      var a3 = filter$1(function(e5) {
        return e5.kind === "teardown" && e5.key === r3;
      })(t2);
      var o3 = makeFetchBody(e4);
      var i2 = makeFetchURL(e4, o3);
      var u2 = makeFetchOptions(e4, o3);
      return H(function(r4) {
        !r4.data ? r4.error : void 0;
      })(takeUntil$1(a3)(makeFetchSource(e4, i2, u2)));
    })(filter$1(function(e4) {
      return e4.kind === "query" || e4.kind === "mutation";
    })(t2));
    var o2 = r2(filter$1(function(e4) {
      return e4.kind !== "query" && e4.kind !== "mutation";
    })(t2));
    return merge$1([a2, o2]);
  };
}
function fallbackExchange(e2) {
  e2.dispatchDebug;
  return function(e3) {
    return filter$1(function() {
      return false;
    })(H(function(e4) {
      if (e4.kind !== "teardown" && false) {
        var n2 = 'No exchange has handled operations of kind "' + e4.kind + `". Check whether you've added an exchange responsible for these operations.`;
        console.warn(n2);
      }
    })(e3));
  };
}
fallbackExchange({
  dispatchDebug: noop2
});
function composeExchanges(e2) {
  return function(r2) {
    var n2 = r2.client;
    r2.dispatchDebug;
    return e2.reduceRight(function(e3, r3) {
      return r3({
        client: n2,
        forward: e3,
        dispatchDebug: function dispatchDebug$1(e4) {
        }
      });
    }, r2.forward);
  };
}
var F = [dedupExchange, cacheExchange, fetchExchange];
var L = function Client(e2) {
  var r2 = new Map();
  var n2 = new Map();
  var t2 = [];
  var a2 = makeSubject$1();
  var i2 = a2.source;
  var u2 = a2.next;
  var c2 = false;
  function dispatchOperation(e3) {
    c2 = true;
    if (e3) {
      u2(e3);
    }
    while (e3 = t2.shift()) {
      u2(e3);
    }
    c2 = false;
  }
  function makeResultSource(e3) {
    var a3 = filter$1(function(r3) {
      return r3.operation.kind === e3.kind && r3.operation.key === e3.key;
    })(m2);
    if (f2.maskTypename) {
      a3 = map$1(function(e4) {
        return _extends$2({}, e4, {
          data: maskTypename(e4.data)
        });
      })(a3);
    }
    if (e3.kind === "mutation") {
      return take$1(1)(onStart$1(function() {
        return dispatchOperation(e3);
      })(a3));
    }
    var u3 = share$1(onEnd$1(function() {
      r2.delete(e3.key);
      n2.delete(e3.key);
      for (var a4 = t2.length - 1; a4 >= 0; a4--) {
        if (t2[a4].key === e3.key) {
          t2.splice(a4, 1);
        }
      }
      dispatchOperation(makeOperation("teardown", e3, e3.context));
    })(onStart$1(function() {
      n2.set(e3.key, u3);
    })(H(function(n3) {
      r2.set(e3.key, n3);
    })(K(function(r3) {
      if (e3.kind !== "query" || r3.stale) {
        return fromValue$1(r3);
      }
      return merge$1([fromValue$1(r3), map$1(function() {
        return _extends$2({}, r3, {
          stale: true
        });
      })(take$1(1)(filter$1(function(r4) {
        return r4.kind === "query" && r4.key === e3.key && r4.context.requestPolicy !== "cache-only";
      })(i2)))]);
    })(takeUntil$1(filter$1(function(r3) {
      return r3.kind === "teardown" && r3.key === e3.key;
    })(i2))(a3))))));
    return u3;
  }
  var s22 = this instanceof Client ? this : Object.create(Client.prototype);
  var f2 = _extends$2(s22, {
    url: e2.url,
    fetchOptions: e2.fetchOptions,
    fetch: e2.fetch,
    suspense: !!e2.suspense,
    requestPolicy: e2.requestPolicy || "cache-first",
    preferGetMethod: !!e2.preferGetMethod,
    maskTypename: !!e2.maskTypename,
    operations$: i2,
    reexecuteOperation: function reexecuteOperation2(e3) {
      if (e3.kind === "mutation" || n2.has(e3.key)) {
        t2.push(e3);
        if (!c2) {
          Promise.resolve().then(dispatchOperation);
        }
      }
    },
    createOperationContext: function createOperationContext(e3) {
      if (!e3) {
        e3 = {};
      }
      return _extends$2({}, {
        url: f2.url,
        fetchOptions: f2.fetchOptions,
        fetch: f2.fetch,
        preferGetMethod: f2.preferGetMethod
      }, e3, {
        suspense: e3.suspense || e3.suspense !== false && f2.suspense,
        requestPolicy: e3.requestPolicy || f2.requestPolicy
      });
    },
    createRequestOperation: function createRequestOperation(e3, r3, n3) {
      return makeOperation(e3, r3, f2.createOperationContext(n3));
    },
    executeRequestOperation: function executeRequestOperation(e3) {
      if (e3.kind === "mutation") {
        return makeResultSource(e3);
      }
      var t3 = n2.get(e3.key) || makeResultSource(e3);
      var a3 = e3.context.requestPolicy === "cache-and-network" || e3.context.requestPolicy === "network-only";
      return make$1(function(n3) {
        return N(n3.next)(onEnd$1(n3.complete)(onStart$1(function() {
          var t4 = r2.get(e3.key);
          if (e3.kind === "subscription") {
            return dispatchOperation(e3);
          } else if (a3) {
            dispatchOperation(e3);
          }
          if (t4 != null && t4 === r2.get(e3.key)) {
            n3.next(a3 ? _extends$2({}, t4, {
              stale: true
            }) : t4);
          } else if (!a3) {
            dispatchOperation(e3);
          }
        })(t3))).unsubscribe;
      });
    },
    executeQuery: function executeQuery(e3, r3) {
      var n3 = f2.createRequestOperation("query", e3, r3);
      return f2.executeRequestOperation(n3);
    },
    executeSubscription: function executeSubscription(e3, r3) {
      var n3 = f2.createRequestOperation("subscription", e3, r3);
      return f2.executeRequestOperation(n3);
    },
    executeMutation: function executeMutation(e3, r3) {
      var n3 = f2.createRequestOperation("mutation", e3, r3);
      return f2.executeRequestOperation(n3);
    },
    query: function query2(e3, r3, n3) {
      if (!n3 || typeof n3.suspense != "boolean") {
        n3 = _extends$2({}, n3, {
          suspense: false
        });
      }
      return withPromise(f2.executeQuery(createRequest(e3, r3), n3));
    },
    readQuery: function readQuery(e3, r3, n3) {
      var t3 = null;
      N(function(e4) {
        t3 = e4;
      })(f2.query(e3, r3, n3)).unsubscribe();
      return t3;
    },
    subscription: function subscription(e3, r3, n3) {
      return f2.executeSubscription(createRequest(e3, r3), n3);
    },
    mutation: function mutation2(e3, r3, n3) {
      return withPromise(f2.executeMutation(createRequest(e3, r3), n3));
    }
  });
  var p2 = noop2;
  var v2 = composeExchanges(e2.exchanges !== void 0 ? e2.exchanges : F);
  var m2 = share$1(v2({
    client: f2,
    dispatchDebug: p2,
    forward: fallbackExchange({
      dispatchDebug: p2
    })
  })(i2));
  publish$1(m2);
  return f2;
};
var G = L;
var getStores = () => {
  const stores = getContext("__svelte__");
  return {
    page: {
      subscribe: stores.page.subscribe
    },
    navigating: {
      subscribe: stores.navigating.subscribe
    },
    get preloading() {
      console.error("stores.preloading is deprecated; use stores.navigating instead");
      return {
        subscribe: stores.navigating.subscribe
      };
    },
    session: stores.session
  };
};
var page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
var css$8 = {
  code: '.nav-style.svelte-jkk46d.svelte-jkk46d{margin:0;padding:0;display:flex;justify-self:end;font-size:2rem}.nav-style.svelte-jkk46d li.svelte-jkk46d{padding:1rem 3rem;display:flex;align-items:center;position:relative;text-transform:uppercase;font-weight:900;font-size:1em;background:none;border:0;cursor:pointer}@media(max-width: 700px){.nav-style.svelte-jkk46d a.svelte-jkk46d{font-size:10px;padding:0 10px}}.nav-style.svelte-jkk46d a.svelte-jkk46d:before{content:"";width:2px;background:var(--colors-lightGray);height:100%;left:0;position:absolute;transform:skew(-20deg);top:0;bottom:0}.nav-style.svelte-jkk46d a.svelte-jkk46d:after{height:2px;background:var(--colors-red);content:"";width:0;position:absolute;transform:translateX(-50%);transition:width 0.4s;transition-timing-function:cubic-bezier(1, -0.65, 0, 2.31);left:50%;margin-top:3rem}.nav-style.svelte-jkk46d a.svelte-jkk46d:hover,.nav-style.svelte-jkk46d a.svelte-jkk46d:focus{outline:none;text-decoration:none}.nav-style.svelte-jkk46d a.svelte-jkk46d:hover:after,.nav-style.svelte-jkk46d a.svelte-jkk46d:focus:after{width:calc(100% - 60px)}@media(max-width: 700px){.nav-style.svelte-jkk46d a.svelte-jkk46d:hover,.nav-style.svelte-jkk46d a.svelte-jkk46d:focus{width:calc(100% - 10px)}}.nav-style.svelte-jkk46d a.active.svelte-jkk46d:after{width:calc(100% - 60px)}@media(max-width: 1300px){.nav-style.svelte-jkk46d.svelte-jkk46d{border-top:1px solid var(--colors-lightGray);width:100%;justify-content:center;font-size:1.5rem}}',
  map: '{"version":3,"file":"Nav.svelte","sources":["Nav.svelte"],"sourcesContent":["<script lang=\\"ts\\">//   import { navStyles } from \\"$lib/styles/NavStyles\\";\\r\\nexport let section;\\r\\n<\/script>\\n\\n<ul class=\\"nav-style\\">\\n    <li>\\n        <a\\n            sveltekit:prefetch\\n            class:active={section === \\"products\\"}\\n            href=\\"/products/1\\"\\n        >\\n            Products\\n        </a>\\n    </li>\\n    <li>\\n        <a sveltekit:prefetch class:active={section === \\"sell\\"} href=\\"/sell\\">\\n            Sell\\n        </a>\\n    </li>\\n    <!--<a sveltekit:prefetch class:active={path === /order} href=/order>\\n        Orders\\n    </a>\\n    <a sveltekit:prefetch class:active={path === /account} href=/account>\\n        Account\\n    </a> -->\\n\\n    <!-- <SignOut /> -->\\n    <!-- <button type=button onClick={openCart}>\\n            My Cart\\n            <CartCount\\n              count={user.cart.reduce(\\n                (tally; cartItem) =>\\n                  tally + (cartItem.product ? cartItem.quantity : 0);\\n                0\\n              )}\\n            />\\n          </button> -->\\n</ul>\\n\\n<style lang=\\"scss\\">.nav-style {\\n  margin: 0;\\n  padding: 0;\\n  display: flex;\\n  justify-self: end;\\n  font-size: 2rem; }\\n  .nav-style li {\\n    padding: 1rem 3rem;\\n    display: flex;\\n    align-items: center;\\n    position: relative;\\n    text-transform: uppercase;\\n    font-weight: 900;\\n    font-size: 1em;\\n    background: none;\\n    border: 0;\\n    cursor: pointer; }\\n  @media (max-width: 700px) {\\n    .nav-style a,\\n    .nav-style button {\\n      font-size: 10px;\\n      padding: 0 10px; } }\\n  .nav-style a:before,\\n  .nav-style button:before {\\n    content: \\"\\";\\n    width: 2px;\\n    background: var(--colors-lightGray);\\n    height: 100%;\\n    left: 0;\\n    position: absolute;\\n    transform: skew(-20deg);\\n    top: 0;\\n    bottom: 0; }\\n  .nav-style a:after,\\n  .nav-style button:after {\\n    height: 2px;\\n    background: var(--colors-red);\\n    content: \\"\\";\\n    width: 0;\\n    position: absolute;\\n    transform: translateX(-50%);\\n    transition: width 0.4s;\\n    transition-timing-function: cubic-bezier(1, -0.65, 0, 2.31);\\n    left: 50%;\\n    margin-top: 3rem; }\\n  .nav-style a:hover, .nav-style a:focus,\\n  .nav-style button:hover,\\n  .nav-style button:focus {\\n    outline: none;\\n    text-decoration: none; }\\n    .nav-style a:hover:after, .nav-style a:focus:after,\\n    .nav-style button:hover:after,\\n    .nav-style button:focus:after {\\n      width: calc(100% - 60px); }\\n    @media (max-width: 700px) {\\n      .nav-style a:hover, .nav-style a:focus,\\n      .nav-style button:hover,\\n      .nav-style button:focus {\\n        width: calc(100% - 10px); } }\\n  .nav-style a.active:after,\\n  .nav-style button.active:after {\\n    width: calc(100% - 60px); }\\n  @media (max-width: 1300px) {\\n    .nav-style {\\n      border-top: 1px solid var(--colors-lightGray);\\n      width: 100%;\\n      justify-content: center;\\n      font-size: 1.5rem; } }\\n</style>\\n"],"names":[],"mappings":"AAuCmB,UAAU,4BAAC,CAAC,AAC7B,MAAM,CAAE,CAAC,CACT,OAAO,CAAE,CAAC,CACV,OAAO,CAAE,IAAI,CACb,YAAY,CAAE,GAAG,CACjB,SAAS,CAAE,IAAI,AAAE,CAAC,AAClB,wBAAU,CAAC,EAAE,cAAC,CAAC,AACb,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,QAAQ,CAAE,QAAQ,CAClB,cAAc,CAAE,SAAS,CACzB,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,GAAG,CACd,UAAU,CAAE,IAAI,CAChB,MAAM,CAAE,CAAC,CACT,MAAM,CAAE,OAAO,AAAE,CAAC,AACpB,MAAM,AAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACzB,wBAAU,CAAC,CAAC,cACM,CAAC,AACjB,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,CAAC,CAAC,IAAI,AAAE,CAAC,AAAC,CAAC,AACxB,wBAAU,CAAC,eAAC,OAAO,AACM,CAAC,AACxB,OAAO,CAAE,EAAE,CACX,KAAK,CAAE,GAAG,CACV,UAAU,CAAE,IAAI,kBAAkB,CAAC,CACnC,MAAM,CAAE,IAAI,CACZ,IAAI,CAAE,CAAC,CACP,QAAQ,CAAE,QAAQ,CAClB,SAAS,CAAE,KAAK,MAAM,CAAC,CACvB,GAAG,CAAE,CAAC,CACN,MAAM,CAAE,CAAC,AAAE,CAAC,AACd,wBAAU,CAAC,eAAC,MAAM,AACM,CAAC,AACvB,MAAM,CAAE,GAAG,CACX,UAAU,CAAE,IAAI,YAAY,CAAC,CAC7B,OAAO,CAAE,EAAE,CACX,KAAK,CAAE,CAAC,CACR,QAAQ,CAAE,QAAQ,CAClB,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,UAAU,CAAE,KAAK,CAAC,IAAI,CACtB,0BAA0B,CAAE,aAAa,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAC3D,IAAI,CAAE,GAAG,CACT,UAAU,CAAE,IAAI,AAAE,CAAC,AACrB,wBAAU,CAAC,eAAC,MAAM,CAAE,wBAAU,CAAC,eAAC,MAAM,AAEd,CAAC,AACvB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,IAAI,AAAE,CAAC,AACxB,wBAAU,CAAC,eAAC,MAAM,MAAM,CAAE,wBAAU,CAAC,eAAC,MAAM,MAAM,AAEpB,CAAC,AAC7B,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,AAAE,CAAC,AAC7B,MAAM,AAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACzB,wBAAU,CAAC,eAAC,MAAM,CAAE,wBAAU,CAAC,eAAC,MAAM,AAEd,CAAC,AACvB,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,AAAE,CAAC,AAAC,CAAC,AACnC,wBAAU,CAAC,CAAC,qBAAO,MAAM,AACM,CAAC,AAC9B,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,AAAE,CAAC,AAC7B,MAAM,AAAC,YAAY,MAAM,CAAC,AAAC,CAAC,AAC1B,UAAU,4BAAC,CAAC,AACV,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,kBAAkB,CAAC,CAC7C,KAAK,CAAE,IAAI,CACX,eAAe,CAAE,MAAM,CACvB,SAAS,CAAE,MAAM,AAAE,CAAC,AAAC,CAAC"}'
};
var Nav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { section } = $$props;
  if ($$props.section === void 0 && $$bindings.section && section !== void 0)
    $$bindings.section(section);
  $$result.css.add(css$8);
  return `<ul class="${"nav-style svelte-jkk46d"}"><li class="${"svelte-jkk46d"}"><a sveltekit:prefetch href="${"/products/1"}" class="${["svelte-jkk46d", section === "products" ? "active" : ""].join(" ").trim()}">Products
        </a></li>
    <li class="${"svelte-jkk46d"}"><a sveltekit:prefetch href="${"/sell"}" class="${["svelte-jkk46d", section === "sell" ? "active" : ""].join(" ").trim()}">Sell
        </a></li>
    

    
    
</ul>`;
});
var Search = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div>Search</div>`;
});
var css$7 = {
  code: ".bar.svelte-29xetv.svelte-29xetv{border-bottom:10px solid black;display:grid;grid-template-columns:auto 1fr;justify-content:space-between;align-items:stretch}.logo.svelte-29xetv.svelte-29xetv{font-size:4rem;margin-left:2rem;position:relative;z-index:2;transform:skew(-7deg);background:var(--colors-red);text-decoration:none;text-transform:uppercase;padding:0.5rem 1rem}.logo.svelte-29xetv a.svelte-29xetv{color:white}",
  map: '{"version":3,"file":"Header.svelte","sources":["Header.svelte"],"sourcesContent":["<script context=\\"module\\">\\n    export const prerender = true;\\n<\/script>\\n\\n<script lang=\\"ts\\">import { page } from \\"$app/stores\\";\\r\\nimport Nav from \\"$lib/components/Nav.svelte\\";\\r\\nimport Search from \\"./Search.svelte\\";\\r\\n$: section = $page.path.split(\\"/\\")[1];\\r\\n<\/script>\\n\\n<header>\\n    <div class=\\"bar\\">\\n        <h1 class=\\"logo\\">\\n            <a href=\\"/\\">Sick fits</a>\\n        </h1>\\n        <Nav {section} />\\n    </div>\\n    <Search />\\n</header>\\n\\n<!-- <Cart /> -->\\n<style>\\n    .bar {\\n        border-bottom: 10px solid black;\\n        display: grid;\\n        grid-template-columns: auto 1fr;\\n        justify-content: space-between;\\n        align-items: stretch;\\n    }\\n\\n    .logo {\\n        font-size: 4rem;\\n        margin-left: 2rem;\\n        position: relative;\\n        z-index: 2;\\n        transform: skew(-7deg);\\n        background: var(--colors-red);\\n        text-decoration: none;\\n        text-transform: uppercase;\\n        padding: 0.5rem 1rem;\\n    }\\n    .logo a {\\n        color: white;\\n    }\\n</style>\\n"],"names":[],"mappings":"AAsBI,IAAI,4BAAC,CAAC,AACF,aAAa,CAAE,IAAI,CAAC,KAAK,CAAC,KAAK,CAC/B,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,IAAI,CAAC,GAAG,CAC/B,eAAe,CAAE,aAAa,CAC9B,WAAW,CAAE,OAAO,AACxB,CAAC,AAED,KAAK,4BAAC,CAAC,AACH,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,IAAI,CACjB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,KAAK,KAAK,CAAC,CACtB,UAAU,CAAE,IAAI,YAAY,CAAC,CAC7B,eAAe,CAAE,IAAI,CACrB,cAAc,CAAE,SAAS,CACzB,OAAO,CAAE,MAAM,CAAC,IAAI,AACxB,CAAC,AACD,mBAAK,CAAC,CAAC,cAAC,CAAC,AACL,KAAK,CAAE,KAAK,AAChB,CAAC"}'
};
var Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let section;
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$result.css.add(css$7);
  section = $page.path.split("/")[1];
  $$unsubscribe_page();
  return `<header><div class="${"bar svelte-29xetv"}"><h1 class="${"logo svelte-29xetv"}"><a href="${"/"}" class="${"svelte-29xetv"}">Sick fits</a></h1>
        ${validate_component(Nav, "Nav").$$render($$result, { section }, {}, {})}</div>
    ${validate_component(Search, "Search").$$render($$result, {}, {}, {})}</header>

`;
});
var prodEndpoint = `https://3b56e4fec941.ngrok.io/api/graphql`;
var perPage = 4;
var defaultAuthor = "Ryan Arpe";
var rootUrl = "https://sveltekit-sickfits.vercel.app";
var defaultTitle = "Ryan Coding Playground";
var defaultDesc = "Playground using Sveltekit and GraphQL";
var seoData = ({
  title = defaultTitle,
  description = defaultDesc,
  canonical = rootUrl,
  type,
  author = defaultAuthor,
  tags = [],
  image
}) => ({
  title: title === defaultTitle ? title : `${title} | ${defaultTitle}`,
  description,
  canonical,
  keywords: tags.join(","),
  openGraph: {
    url: canonical,
    title,
    type,
    description,
    authors: [author],
    tags
  },
  twitter: { site: "@qlikArpe", title, description, image }
});
var SvelteSeo = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { title = void 0 } = $$props;
  let { noindex = false } = $$props;
  let { nofollow = false } = $$props;
  let { description = void 0 } = $$props;
  let { keywords = void 0 } = $$props;
  let { canonical = void 0 } = $$props;
  let { openGraph = void 0 } = $$props;
  let { twitter = void 0 } = $$props;
  let { jsonLd = void 0 } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.noindex === void 0 && $$bindings.noindex && noindex !== void 0)
    $$bindings.noindex(noindex);
  if ($$props.nofollow === void 0 && $$bindings.nofollow && nofollow !== void 0)
    $$bindings.nofollow(nofollow);
  if ($$props.description === void 0 && $$bindings.description && description !== void 0)
    $$bindings.description(description);
  if ($$props.keywords === void 0 && $$bindings.keywords && keywords !== void 0)
    $$bindings.keywords(keywords);
  if ($$props.canonical === void 0 && $$bindings.canonical && canonical !== void 0)
    $$bindings.canonical(canonical);
  if ($$props.openGraph === void 0 && $$bindings.openGraph && openGraph !== void 0)
    $$bindings.openGraph(openGraph);
  if ($$props.twitter === void 0 && $$bindings.twitter && twitter !== void 0)
    $$bindings.twitter(twitter);
  if ($$props.jsonLd === void 0 && $$bindings.jsonLd && jsonLd !== void 0)
    $$bindings.jsonLd(jsonLd);
  return `${$$result.head += `${title ? `${$$result.title = `<title>${escape2(title)}</title>`, ""}` : ``}<meta name="${"robots"}"${add_attribute("content", `${noindex ? "noindex" : "index"},${nofollow ? "nofollow" : "follow"}`, 0)} data-svelte="svelte-1f0hxex"><meta name="${"googlebot"}"${add_attribute("content", `${noindex ? "noindex" : "index"},${nofollow ? "nofollow" : "follow"}`, 0)} data-svelte="svelte-1f0hxex">${description ? `<meta name="${"description"}"${add_attribute("content", description, 0)} data-svelte="svelte-1f0hxex">` : ``}${canonical ? `<link rel="${"canonical"}"${add_attribute("href", canonical, 0)} data-svelte="svelte-1f0hxex">` : ``}${keywords ? `<meta name="${"keywords"}"${add_attribute("content", keywords, 0)} data-svelte="svelte-1f0hxex">` : ``}${openGraph ? `${openGraph.title ? `<meta property="${"og:title"}"${add_attribute("content", openGraph.title, 0)} data-svelte="svelte-1f0hxex">` : ``}

    ${openGraph.description ? `<meta property="${"og:description"}"${add_attribute("content", openGraph.description, 0)} data-svelte="svelte-1f0hxex">` : ``}

    ${openGraph.url || canonical ? `<meta property="${"og:url"}"${add_attribute("content", openGraph.url || canonical, 0)} data-svelte="svelte-1f0hxex">` : ``}

    ${openGraph.type ? `<meta property="${"og:type"}"${add_attribute("content", openGraph.type.toLowerCase(), 0)} data-svelte="svelte-1f0hxex">` : ``}

    ${openGraph.article ? `${openGraph.article.publishedTime ? `<meta property="${"article:published_time"}"${add_attribute("content", openGraph.article.publishedTime, 0)} data-svelte="svelte-1f0hxex">` : ``}

      ${openGraph.article.modifiedTime ? `<meta property="${"article:modified_time"}"${add_attribute("content", openGraph.article.modifiedTime, 0)} data-svelte="svelte-1f0hxex">` : ``}

      ${openGraph.article.expirationTime ? `<meta property="${"article:expiration_time"}"${add_attribute("content", openGraph.article.expirationTime, 0)} data-svelte="svelte-1f0hxex">` : ``}

      ${openGraph.article.section ? `<meta property="${"article:section"}"${add_attribute("content", openGraph.article.section, 0)} data-svelte="svelte-1f0hxex">` : ``}

      ${openGraph.article.authors && openGraph.article.authors.length ? `${each(openGraph.article.authors, (author) => `<meta property="${"article:author"}"${add_attribute("content", author, 0)} data-svelte="svelte-1f0hxex">`)}` : ``}

      ${openGraph.article.tags && openGraph.article.tags.length ? `${each(openGraph.article.tags, (tag) => `<meta property="${"article:tag"}"${add_attribute("content", tag, 0)} data-svelte="svelte-1f0hxex">`)}` : ``}` : ``}

    ${openGraph.images && openGraph.images.length ? `${each(openGraph.images, (image) => `<meta property="${"og:image"}"${add_attribute("content", image.url, 0)} data-svelte="svelte-1f0hxex">
        ${image.alt ? `<meta property="${"og:image:alt"}"${add_attribute("content", image.alt, 0)} data-svelte="svelte-1f0hxex">` : ``}
        ${image.width ? `<meta property="${"og:image:width"}"${add_attribute("content", image.width.toString(), 0)} data-svelte="svelte-1f0hxex">` : ``}
        ${image.height ? `<meta property="${"og:image:height"}"${add_attribute("content", image.height.toString(), 0)} data-svelte="svelte-1f0hxex">` : ``}`)}` : ``}` : ``}${twitter ? `<meta name="${"twitter:card"}" content="${"summary_large_image"}" data-svelte="svelte-1f0hxex">
    ${twitter.site ? `<meta name="${"twitter:site"}"${add_attribute("content", twitter.site, 0)} data-svelte="svelte-1f0hxex">` : ``}
    ${twitter.title ? `<meta name="${"twitter:title"}"${add_attribute("content", twitter.title, 0)} data-svelte="svelte-1f0hxex">` : ``}
    ${twitter.description ? `<meta name="${"twitter:description"}"${add_attribute("content", twitter.description, 0)} data-svelte="svelte-1f0hxex">` : ``}
    ${twitter.image ? `<meta name="${"twitter:image"}"${add_attribute("content", twitter.image, 0)} data-svelte="svelte-1f0hxex">` : ``}
    ${twitter.imageAlt ? `<meta name="${"twitter:image:alt"}"${add_attribute("content", twitter.imageAlt, 0)} data-svelte="svelte-1f0hxex">` : ``}` : ``}${jsonLd ? `<!-- HTML_TAG_START -->${`<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    ...jsonLd
  }) + "<"}/script>`}<!-- HTML_TAG_END -->` : ``}`, ""}`;
});
var subscriber_queue2 = [];
function writable2(value, start = noop$1) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal2(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue2.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue2.push(subscriber, value);
        }
        if (run_queue) {
          for (let i2 = 0; i2 < subscriber_queue2.length; i2 += 2) {
            subscriber_queue2[i2][0](subscriber_queue2[i2 + 1]);
          }
          subscriber_queue2.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop$1) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop$1;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function _extends$1() {
  return (_extends$1 = Object.assign || function(e2) {
    for (var t2 = 1; t2 < arguments.length; t2++) {
      var n2 = arguments[t2];
      for (var r2 in n2) {
        if (Object.prototype.hasOwnProperty.call(n2, r2)) {
          e2[r2] = n2[r2];
        }
      }
    }
    return e2;
  }).apply(this, arguments);
}
function operationStore(n2, i2, o2) {
  var u2 = {
    query: n2,
    variables: i2 || null,
    context: o2
  };
  var a2 = {
    stale: false,
    fetching: true,
    data: void 0,
    error: void 0,
    extensions: void 0
  };
  var c2 = writable2(a2);
  var s22 = false;
  a2.set = function set(n3) {
    if (!n3 || n3 === a2) {
      return;
    }
    s22 = true;
    var i3 = false;
    if ("query" in n3 || "variables" in n3) {
      var o3 = createRequest(u2.query, u2.variables);
      var f2 = createRequest(n3.query || u2.query, n3.variables || u2.variables);
      if (o3.key !== f2.key) {
        i3 = true;
        u2.query = n3.query || u2.query;
        u2.variables = n3.variables || u2.variables || null;
      }
    }
    if ("context" in n3) {
      if (stringifyVariables(u2.context) !== stringifyVariables(n3.context)) {
        i3 = true;
        u2.context = n3.context;
      }
    }
    for (var l2 in n3) {
      if (l2 === "query" || l2 === "variables" || l2 === "context") {
        continue;
      } else if (l2 === "fetching") {
        a2[l2] = !!n3[l2];
      } else if (l2 in a2) {
        a2[l2] = n3[l2];
      }
      i3 = true;
    }
    a2.stale = !!n3.stale;
    s22 = false;
    if (i3) {
      c2.set(a2);
    }
  };
  a2.update = function update(e2) {
    a2.set(e2(a2));
  };
  a2.subscribe = function subscribe2(e2, t2) {
    return c2.subscribe(e2, t2);
  };
  a2.reexecute = function(e2) {
    u2.context = _extends$1({}, e2 || u2.context);
    c2.set(a2);
  };
  Object.keys(u2).forEach(function(e2) {
    Object.defineProperty(a2, e2, {
      configurable: false,
      get: function() {
        return u2[e2];
      },
      set: function set(t2) {
        u2[e2] = t2;
        if (!s22) {
          c2.set(a2);
        }
      }
    });
  });
  return a2;
}
function getClient() {
  return getContext("$$_urql");
}
function setClient(e2) {
  setContext("$$_urql", e2);
}
var g$1 = {
  fetching: false,
  stale: false,
  error: void 0,
  data: void 0,
  extensions: void 0
};
function toSource(t2) {
  return make$1(function(n2) {
    var r2;
    var i2 = {};
    return t2.subscribe(function(t3) {
      var o2 = createRequest(t3.query, t3.variables);
      if ((o2.context = t3.context) !== i2 || o2.key !== r2) {
        r2 = o2.key;
        i2 = t3.context;
        n2.next(o2);
      }
    });
  });
}
function query(e2) {
  var t2 = getClient();
  N(function(t3) {
    e2.set(t3);
  })(scan$1(function(e3, t3) {
    return _extends$1({}, e3, t3);
  }, g$1)(K(function(e3) {
    if (e3.context && e3.context.pause) {
      return fromValue$1({
        fetching: false,
        stale: false
      });
    }
    return concat$1([fromValue$1({
      fetching: true,
      stale: false
    }), map$1(function(e4) {
      return _extends$1({}, {
        fetching: false
      }, e4, {
        stale: !!e4.stale
      });
    })(t2.executeQuery(e3, e3.context)), fromValue$1({
      fetching: false,
      stale: false
    })]);
  })(toSource(e2))));
  return e2;
}
function mutation(t2) {
  var n2 = getClient();
  var r2 = typeof t2.subscribe != "function" ? operationStore(t2.query, t2.variables) : t2;
  return function(t3, i2) {
    var o2 = {
      fetching: true,
      variables: t3 || r2.variables,
      context: i2 || r2.context
    };
    r2.set(o2);
    return toPromise$1(take$1(1)(n2.executeMutation(createRequest(r2.query, r2.variables || {}), r2.context))).then(function(e2) {
      var t4 = _extends$1({}, {
        fetching: false
      }, e2);
      r2.set(t4);
      return r2;
    });
  };
}
var css$6 = {
  code: "@keyframes svelte-m6lbap-ldio-yo1ym2j89t{0%{height:110.00000000000001px}33.33%{height:154px}66.66%{height:66px}100%{height:110.00000000000001px}}.ldio-yo1ym2j89t.svelte-m6lbap.svelte-m6lbap.svelte-m6lbap{transform-origin:220px 220px !important}.ldio-yo1ym2j89t.svelte-m6lbap>div.svelte-m6lbap.svelte-m6lbap{transform:rotate(180deg);width:100%;height:100%}.ldio-yo1ym2j89t.svelte-m6lbap>div.svelte-m6lbap>div.svelte-m6lbap{position:absolute;width:17px;height:88px;animation:svelte-m6lbap-ldio-yo1ym2j89t 1s cubic-bezier(0.5, 0, 0.5, 1) infinite}.ldio-yo1ym2j89t.svelte-m6lbap>div.svelte-m6lbap>div.svelte-m6lbap:nth-child(1){left:27.500000000000004px;background:#26a0a7;animation-delay:-1s}.ldio-yo1ym2j89t.svelte-m6lbap>div.svelte-m6lbap>div.svelte-m6lbap:nth-child(2){left:57.500000000000004px;background:#d76c6c;animation-delay:-0.8s}.ldio-yo1ym2j89t.svelte-m6lbap>div.svelte-m6lbap>div.svelte-m6lbap:nth-child(3){left:87.50000000000001px;background:#4d6474;animation-delay:-1.2s}.ldio-yo1ym2j89t.svelte-m6lbap>div.svelte-m6lbap>div.svelte-m6lbap:nth-child(4){left:117.50000000000001px;background:#70ba6e;animation-delay:-1.6s}.loadingio-spinner-bar-chart-1sgcnmb5f3d.svelte-m6lbap.svelte-m6lbap.svelte-m6lbap{width:140px;height:150px;display:inline-block;overflow:hidden;background:none;position:absolute;top:50%;left:50%;margin-left:-70px}.ldio-yo1ym2j89t.svelte-m6lbap.svelte-m6lbap.svelte-m6lbap{width:100%;height:100%;position:relative;transform:translateZ(0) scale(1);backface-visibility:hidden;transform-origin:0 0}.ldio-yo1ym2j89t.svelte-m6lbap div.svelte-m6lbap.svelte-m6lbap{box-sizing:content-box}",
  map: '{"version":3,"file":"Spinner.svelte","sources":["Spinner.svelte"],"sourcesContent":["<script>\\r\\n    export let nav = undefined;\\r\\n<\/script>\\r\\n\\r\\n<div\\r\\n    class:loadingio-spinner-modal={nav == true}\\r\\n    class=\\"loadingio-spinner-bar-chart-1sgcnmb5f3d\\"\\r\\n>\\r\\n    <div class=\\"ldio-yo1ym2j89t\\">\\r\\n        <div>\\r\\n            <div />\\r\\n            <div />\\r\\n            <div />\\r\\n            <div />\\r\\n        </div>\\r\\n    </div>\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n    @keyframes ldio-yo1ym2j89t {\\r\\n        0% {\\r\\n            height: 110.00000000000001px;\\r\\n        }\\r\\n        33.33% {\\r\\n            height: 154px;\\r\\n        }\\r\\n        66.66% {\\r\\n            height: 66px;\\r\\n        }\\r\\n        100% {\\r\\n            height: 110.00000000000001px;\\r\\n        }\\r\\n    }\\r\\n    .ldio-yo1ym2j89t {\\r\\n        transform-origin: 220px 220px !important;\\r\\n    }\\r\\n    .ldio-yo1ym2j89t > div {\\r\\n        transform: rotate(180deg);\\r\\n        width: 100%;\\r\\n        height: 100%;\\r\\n    }\\r\\n    .ldio-yo1ym2j89t > div > div {\\r\\n        position: absolute;\\r\\n        width: 17px;\\r\\n        height: 88px;\\r\\n        animation: ldio-yo1ym2j89t 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;\\r\\n    }\\r\\n    .ldio-yo1ym2j89t > div > div:nth-child(1) {\\r\\n        left: 27.500000000000004px;\\r\\n        background: #26a0a7;\\r\\n        animation-delay: -1s;\\r\\n    }\\r\\n    .ldio-yo1ym2j89t > div > div:nth-child(2) {\\r\\n        left: 57.500000000000004px;\\r\\n        background: #d76c6c;\\r\\n        animation-delay: -0.8s;\\r\\n    }\\r\\n    .ldio-yo1ym2j89t > div > div:nth-child(3) {\\r\\n        left: 87.50000000000001px;\\r\\n        background: #4d6474;\\r\\n        animation-delay: -1.2s;\\r\\n    }\\r\\n    .ldio-yo1ym2j89t > div > div:nth-child(4) {\\r\\n        left: 117.50000000000001px;\\r\\n        background: #70ba6e;\\r\\n        animation-delay: -1.6s;\\r\\n    }\\r\\n    .loadingio-spinner-bar-chart-1sgcnmb5f3d {\\r\\n        width: 140px;\\r\\n        height: 150px;\\r\\n        display: inline-block;\\r\\n        overflow: hidden;\\r\\n        background: none;\\r\\n        position: absolute;\\r\\n        top: 50%;\\r\\n        left: 50%;\\r\\n        margin-left: -70px;\\r\\n        /* margin-top: -75px; */\\r\\n    }\\r\\n    .ldio-yo1ym2j89t {\\r\\n        width: 100%;\\r\\n        height: 100%;\\r\\n        position: relative;\\r\\n        transform: translateZ(0) scale(1);\\r\\n        backface-visibility: hidden;\\r\\n        transform-origin: 0 0; /* see note above */\\r\\n    }\\r\\n    .ldio-yo1ym2j89t div {\\r\\n        box-sizing: content-box;\\r\\n    }\\r\\n\\r\\n    /* generated by https://loading.io/ */\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAmBI,WAAW,6BAAgB,CAAC,AACxB,EAAE,AAAC,CAAC,AACA,MAAM,CAAE,oBAAoB,AAChC,CAAC,AACD,MAAM,AAAC,CAAC,AACJ,MAAM,CAAE,KAAK,AACjB,CAAC,AACD,MAAM,AAAC,CAAC,AACJ,MAAM,CAAE,IAAI,AAChB,CAAC,AACD,IAAI,AAAC,CAAC,AACF,MAAM,CAAE,oBAAoB,AAChC,CAAC,AACL,CAAC,AACD,gBAAgB,0CAAC,CAAC,AACd,gBAAgB,CAAE,KAAK,CAAC,KAAK,CAAC,UAAU,AAC5C,CAAC,AACD,8BAAgB,CAAG,GAAG,4BAAC,CAAC,AACpB,SAAS,CAAE,OAAO,MAAM,CAAC,CACzB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AAChB,CAAC,AACD,8BAAgB,CAAG,iBAAG,CAAG,GAAG,cAAC,CAAC,AAC1B,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,SAAS,CAAE,6BAAe,CAAC,EAAE,CAAC,aAAa,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,QAAQ,AACvE,CAAC,AACD,8BAAgB,CAAG,iBAAG,CAAG,iBAAG,WAAW,CAAC,CAAC,AAAC,CAAC,AACvC,IAAI,CAAE,oBAAoB,CAC1B,UAAU,CAAE,OAAO,CACnB,eAAe,CAAE,GAAG,AACxB,CAAC,AACD,8BAAgB,CAAG,iBAAG,CAAG,iBAAG,WAAW,CAAC,CAAC,AAAC,CAAC,AACvC,IAAI,CAAE,oBAAoB,CAC1B,UAAU,CAAE,OAAO,CACnB,eAAe,CAAE,KAAK,AAC1B,CAAC,AACD,8BAAgB,CAAG,iBAAG,CAAG,iBAAG,WAAW,CAAC,CAAC,AAAC,CAAC,AACvC,IAAI,CAAE,iBAAiB,EAAE,CACzB,UAAU,CAAE,OAAO,CACnB,eAAe,CAAE,KAAK,AAC1B,CAAC,AACD,8BAAgB,CAAG,iBAAG,CAAG,iBAAG,WAAW,CAAC,CAAC,AAAC,CAAC,AACvC,IAAI,CAAE,gBAAgB,IAAI,CAC1B,UAAU,CAAE,OAAO,CACnB,eAAe,CAAE,KAAK,AAC1B,CAAC,AACD,wCAAwC,0CAAC,CAAC,AACtC,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,YAAY,CACrB,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,IAAI,CAChB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,IAAI,CAAE,GAAG,CACT,WAAW,CAAE,KAAK,AAEtB,CAAC,AACD,gBAAgB,0CAAC,CAAC,AACd,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,QAAQ,CAAE,QAAQ,CAClB,SAAS,CAAE,WAAW,CAAC,CAAC,CAAC,MAAM,CAAC,CAAC,CACjC,mBAAmB,CAAE,MAAM,CAC3B,gBAAgB,CAAE,CAAC,CAAC,CAAC,AACzB,CAAC,AACD,8BAAgB,CAAC,GAAG,4BAAC,CAAC,AAClB,UAAU,CAAE,WAAW,AAC3B,CAAC"}'
};
var Spinner = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { nav = void 0 } = $$props;
  if ($$props.nav === void 0 && $$bindings.nav && nav !== void 0)
    $$bindings.nav(nav);
  $$result.css.add(css$6);
  return `<div class="${[
    "loadingio-spinner-bar-chart-1sgcnmb5f3d svelte-m6lbap",
    nav == true ? "loadingio-spinner-modal" : ""
  ].join(" ").trim()}"><div class="${"ldio-yo1ym2j89t svelte-m6lbap"}"><div class="${"svelte-m6lbap"}"><div class="${"svelte-m6lbap"}"></div>
            <div class="${"svelte-m6lbap"}"></div>
            <div class="${"svelte-m6lbap"}"></div>
            <div class="${"svelte-m6lbap"}"></div></div></div>
</div>`;
});
function _extends() {
  return (_extends = Object.assign || function(e2) {
    for (var r2 = 1; r2 < arguments.length; r2++) {
      var t2 = arguments[r2];
      for (var n2 in t2) {
        if (Object.prototype.hasOwnProperty.call(t2, n2)) {
          e2[n2] = t2[n2];
        }
      }
    }
    return e2;
  }).apply(this, arguments);
}
function multipartFetchExchange(f2) {
  var d2 = f2.forward;
  f2.dispatchDebug;
  return function(f3) {
    var l2 = share$1(f3);
    var v2 = D(function(e2) {
      var r2 = filter$1(function(r3) {
        return r3.kind === "teardown" && r3.key === e2.key;
      })(l2);
      var o2 = (0, import_extractFiles.default)(_extends({}, e2.variables));
      var f4 = o2.files;
      var d3 = makeFetchBody({
        query: e2.query,
        variables: o2.clone
      });
      var v3;
      var m3;
      if (f4.size) {
        v3 = makeFetchURL(e2);
        if ((m3 = makeFetchOptions(e2)).headers["content-type"] === "application/json") {
          delete m3.headers["content-type"];
        }
        m3.method = "POST";
        m3.body = new FormData();
        m3.body.append("operations", JSON.stringify(d3));
        var y2 = {};
        var b2 = 0;
        f4.forEach(function(e3) {
          y2[++b2] = e3.map(function(e4) {
            return "variables." + e4;
          });
        });
        m3.body.append("map", JSON.stringify(y2));
        b2 = 0;
        f4.forEach(function(e3, r3) {
          m3.body.append("" + ++b2, r3, r3.name);
        });
      } else {
        m3 = makeFetchOptions(e2, d3);
        v3 = makeFetchURL(e2, d3);
      }
      return H(function(r3) {
        !r3.data ? r3.error : void 0;
      })(takeUntil$1(r2)(makeFetchSource(e2, v3, m3)));
    })(filter$1(function(e2) {
      return e2.kind === "query" || e2.kind === "mutation";
    })(l2));
    var m2 = d2(filter$1(function(e2) {
      return e2.kind !== "query" && e2.kind !== "mutation";
    })(l2));
    return merge$1([v2, m2]);
  };
}
var css$5 = {
  code: '@import "$lib/styles/test.css";',
  map: '{"version":3,"file":"__layout.svelte","sources":["__layout.svelte"],"sourcesContent":["<script context=\\"module\\">\\n    import {\\n        dedupExchange,\\n        cacheExchange,\\n        fetchExchange,\\n        createClient,\\n    } from \\"@urql/core\\";\\n\\n    export function load({ fetch }) {\\n        const client = createClient({\\n            url: prodEndpoint,\\n            fetch: fetch,\\n            exchanges: [dedupExchange, cacheExchange, fetchExchange],\\n        });\\n        let fetching = true;\\n        return { props: { client, fetching }, context: { client } };\\n    }\\n<\/script>\\n\\n<script>\\n    //import { globalStyles } from \\"$lib/styles/global\\";\\n    import Header from \\"$lib/components/Header.svelte\\";\\n    import \\"../app.css\\";\\n    import { prodEndpoint } from \\"../../config\\";\\n    import { afterUpdate, onMount } from \\"svelte\\";\\n    import { seoData } from \\"$lib/SEO\\";\\n    import SvelteSeo from \\"svelte-seo\\";\\n    import { setClient } from \\"@urql/svelte\\";\\n    import Spinner from \\"$lib/UI/Spinner.svelte\\";\\n\\n    import { multipartFetchExchange } from \\"@urql/exchange-multipart-fetch\\";\\n\\n    //onMount(() => globalStyles());\\n\\n    // export let product = [];\\n    //export let client;\\n    export let fetching;\\n\\n    //$: console.log(client);\\n    const client = createClient({\\n        url: prodEndpoint,\\n        exchanges: [dedupExchange, cacheExchange, multipartFetchExchange],\\n    });\\n\\n    setClient(client);\\n\\n    afterUpdate(() => {\\n        fetching = false;\\n    });\\n<\/script>\\n\\n<SvelteSeo {...seoData({})} />\\n\\n<main>\\n    <Header />\\n    {#if fetching}\\n        <Spinner nav={fetching} />\\n    {:else}\\n        <div class=\\"container\\">\\n            <slot />\\n            <!-- /<button class={buttons({ size: \\"large\\" })}>Hello Worls</button> -->\\n        </div>\\n    {/if}\\n</main>\\n\\n<style>\\n    @import \\"$lib/styles/test.css\\";\\n</style>\\n"],"names":[],"mappings":"AAkEI,QAAQ,sBAAsB,CAAC"}'
};
function load$4({ fetch: fetch2 }) {
  const client = G({
    url: prodEndpoint,
    fetch: fetch2,
    exchanges: [dedupExchange, cacheExchange, fetchExchange]
  });
  let fetching = true;
  return {
    props: { client, fetching },
    context: { client }
  };
}
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { fetching } = $$props;
  const client = G({
    url: prodEndpoint,
    exchanges: [dedupExchange, cacheExchange, multipartFetchExchange]
  });
  setClient(client);
  if ($$props.fetching === void 0 && $$bindings.fetching && fetching !== void 0)
    $$bindings.fetching(fetching);
  $$result.css.add(css$5);
  return `${validate_component(SvelteSeo, "SvelteSeo").$$render($$result, Object.assign(seoData({})), {}, {})}

<main>${validate_component(Header, "Header").$$render($$result, {}, {}, {})}
    ${fetching ? `${validate_component(Spinner, "Spinner").$$render($$result, { nav: fetching }, {}, {})}` : `<div class="${"container"}">${slots.default ? slots.default({}) : ``}
            </div>`}
</main>`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout,
  load: load$4
});
function load$3({ error: error22, status }) {
  return { props: { error: error22, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error22 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  return `<h1>${escape2(status)}</h1>

<pre>${escape2(error22.message)}</pre>



${error22.frame ? `<pre>${escape2(error22.frame)}</pre>` : ``}
${error22.stack ? `<pre>${escape2(error22.stack)}</pre>` : ``}`;
});
var error2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load: load$3
});
function formatMoney(amount = 0) {
  const options2 = {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2
  };
  if (amount % 100)
    options2.minimumFractionDigits = 0;
  const formatter = Intl.NumberFormat("en-GB", options2);
  return formatter.format(amount / 100);
}
var { toPrimitive: e } = Symbol;
var t = Symbol.for("sxs.composers");
var { assign: n, create: r, defineProperties: i, getOwnPropertyDescriptors: o } = Object;
var a = (t2, r2, a2) => n(i(t2, o(a2)), { [e]: () => t2[r2], toString: () => t2[r2] });
var l = (e2) => e2.includes("-") ? e2 : e2.replace(/[A-Z]/g, (e3) => "-" + e3.toLowerCase());
var s2 = (e2, t2) => e2.reduce((e3, n2) => (e3.push(...t2.map((e4) => e4.includes("&") ? e4.replace(/&/g, /[ +>|~]/.test(n2) && /&.*&/.test(e4) ? `:is(${n2})` : n2) : n2 + " " + e4)), e3), []);
var { isArray: d } = Array;
var { from: c } = Array;
var { prototype: { toString: g } } = Object;
var p = /\s*,\s*(?![^()]*\))/;
var m = /([\d.]+)([^]*)/;
var h = { blockSize: 1, height: 1, inlineSize: 1, maxBlockSize: 1, maxHeight: 1, maxInlineSize: 1, maxWidth: 1, minBlockSize: 1, minHeight: 1, minInlineSize: 1, minWidth: 1, width: 1 };
var u = { animationDelay: 1, animationDuration: 1, backgroundSize: 1, blockSize: 1, border: 1, borderBlock: 1, borderBlockEnd: 1, borderBlockEndWidth: 1, borderBlockStart: 1, borderBlockStartWidth: 1, borderBlockWidth: 1, borderBottom: 1, borderBottomLeftRadius: 1, borderBottomRightRadius: 1, borderBottomWidth: 1, borderEndEndRadius: 1, borderEndStartRadius: 1, borderInlineEnd: 1, borderInlineEndWidth: 1, borderInlineStart: 1, borderInlineStartWidth: 1, borderInlineWidth: 1, borderLeft: 1, borderLeftWidth: 1, borderRadius: 1, borderRight: 1, borderRightWidth: 1, borderSpacing: 1, borderStartEndRadius: 1, borderStartStartRadius: 1, borderTop: 1, borderTopLeftRadius: 1, borderTopRightRadius: 1, borderTopWidth: 1, borderWidth: 1, bottom: 1, columnGap: 1, columnRule: 1, columnRuleWidth: 1, columnWidth: 1, containIntrinsicSize: 1, flexBasis: 1, fontSize: 1, gap: 1, gridAutoColumns: 1, gridAutoRows: 1, gridTemplateColumns: 1, gridTemplateRows: 1, height: 1, inlineSize: 1, inset: 1, insetBlock: 1, insetBlockEnd: 1, insetBlockStart: 1, insetInline: 1, insetInlineEnd: 1, insetInlineStart: 1, left: 1, letterSpacing: 1, margin: 1, marginBlock: 1, marginBlockEnd: 1, marginBlockStart: 1, marginBottom: 1, marginInline: 1, marginInlineEnd: 1, marginInlineStart: 1, marginLeft: 1, marginRight: 1, marginTop: 1, maxBlockSize: 1, maxHeight: 1, maxInlineSize: 1, maxWidth: 1, minBlockSize: 1, minHeight: 1, minInlineSize: 1, minWidth: 1, offsetDistance: 1, offsetRotate: 1, outline: 1, outlineOffset: 1, outlineWidth: 1, overflowClipMargin: 1, padding: 1, paddingBlock: 1, paddingBlockEnd: 1, paddingBlockStart: 1, paddingBottom: 1, paddingInline: 1, paddingInlineEnd: 1, paddingInlineStart: 1, paddingLeft: 1, paddingRight: 1, paddingTop: 1, perspective: 1, right: 1, rowGap: 1, scrollMargin: 1, scrollMarginBlock: 1, scrollMarginBlockEnd: 1, scrollMarginBlockStart: 1, scrollMarginBottom: 1, scrollMarginInline: 1, scrollMarginInlineEnd: 1, scrollMarginInlineStart: 1, scrollMarginLeft: 1, scrollMarginRight: 1, scrollMarginTop: 1, scrollPadding: 1, scrollPaddingBlock: 1, scrollPaddingBlockEnd: 1, scrollPaddingBlockStart: 1, scrollPaddingBottom: 1, scrollPaddingInline: 1, scrollPaddingInlineEnd: 1, scrollPaddingInlineStart: 1, scrollPaddingLeft: 1, scrollPaddingRight: 1, scrollPaddingTop: 1, shapeMargin: 1, textDecoration: 1, textDecorationThickness: 1, textIndent: 1, textUnderlineOffset: 1, top: 1, transitionDelay: 1, transitionDuration: 1, verticalAlign: 1, width: 1, wordSpacing: 1 };
var b = /\s+(?![^()]*\))/;
var f = (e2) => (t2) => e2(...typeof t2 == "string" ? String(t2).split(b) : [t2]);
var S = JSON.stringify;
var k = { appearance: (e2) => ({ WebkitAppearance: e2, appearance: e2 }), backfaceVisibility: (e2) => ({ WebkitBackfaceVisibility: e2, backfaceVisibility: e2 }), backdropFilter: (e2) => ({ WebkitBackdropFilter: e2, backdropFilter: e2 }), backgroundClip: (e2) => ({ WebkitBackgroundClip: e2, backgroundClip: e2 }), boxDecorationBreak: (e2) => ({ WebkitBoxDecorationBreak: e2, boxDecorationBreak: e2 }), clipPath: (e2) => ({ WebkitClipPath: e2, clipPath: e2 }), content: (e2) => ({ content: e2.includes('"') || e2.includes("'") || /^([A-Za-z]+\([^]*|[^]*-quote|inherit|initial|none|normal|revert|unset)$/.test(e2) ? e2 : `"${e2}"` }), hyphens: (e2) => ({ WebkitHyphens: e2, hyphens: e2 }), maskImage: (e2) => ({ WebkitMaskImage: e2, maskImage: e2 }), tabSize: (e2) => ({ MozTabSize: e2, tabSize: e2 }), userSelect: (e2) => ({ WebkitUserSelect: e2, userSelect: e2 }), marginBlock: f((e2, t2) => ({ marginBlockStart: e2, marginBlockEnd: t2 || e2 })), marginInline: f((e2, t2) => ({ marginInlineStart: e2, marginInlineEnd: t2 || e2 })), maxSize: f((e2, t2) => ({ maxBlockSize: e2, maxInlineSize: t2 || e2 })), minSize: f((e2, t2) => ({ minBlockSize: e2, minInlineSize: t2 || e2 })), paddingBlock: f((e2, t2) => ({ paddingBlockStart: e2, paddingBlockEnd: t2 || e2 })), paddingInline: f((e2, t2) => ({ paddingInlineStart: e2, paddingInlineEnd: t2 || e2 })) };
var B = (e2) => {
  let t2, n2, r2, i2;
  const o2 = {};
  return (a2) => {
    const c2 = S(a2);
    return c2 in o2 ? o2[c2] : o2[c2] = ((e3, t3) => {
      const n3 = new WeakSet(), r3 = (e4, i3, o3, a3, c3) => {
        let m2 = "";
        e:
          for (const h2 in e4) {
            const u2 = h2.charCodeAt(0) === 64;
            for (const b2 of u2 && d(e4[h2]) ? e4[h2] : [e4[h2]]) {
              if (t3 && (h2 !== a3 || b2 !== c3)) {
                const n4 = t3(h2, b2, e4);
                if (n4 !== null) {
                  m2 += typeof n4 == "object" && n4 ? r3(n4, i3, o3, h2, b2) : n4 == null ? "" : n4;
                  continue e;
                }
              }
              if (typeof b2 == "object" && b2 && b2.toString === g) {
                n3.has(i3) && (n3.delete(i3), m2 += "}");
                const e5 = Object(h2), t4 = u2 ? i3 : i3.length ? s2(i3, h2.split(p)) : h2.split(p);
                m2 += r3(b2, t4, u2 ? o3.concat(e5) : o3), n3.has(e5) && (n3.delete(e5), m2 += "}"), n3.has(t4) && (n3.delete(t4), m2 += "}");
              } else {
                for (let e5 = 0; e5 < o3.length; ++e5)
                  n3.has(o3[e5]) || (n3.add(o3[e5]), m2 += o3[e5] + "{");
                i3.length && !n3.has(i3) && (n3.add(i3), m2 += i3 + "{"), m2 += (u2 ? h2 + " " : l(h2) + ":") + String(b2) + ";";
              }
            }
          }
        return m2;
      };
      return r3(e3, [], []);
    })(a2, (o3, a3) => {
      const s22 = o3.charCodeAt(0), d2 = s22 === 64 ? o3 : /[A-Z]/.test(c3 = o3) ? c3 : c3.replace(/-[^]/g, (e3) => e3[1].toUpperCase());
      var c3;
      const g2 = s22 === 64 ? o3 : l(o3);
      if (typeof e2.utils[o3] == "function") {
        if (e2.utils[o3] != r2 || a3 != i2)
          return r2 = e2.utils[o3], i2 = a3, r2(e2)(i2);
      } else if (typeof k[d2] == "function" && (k[d2] != r2 || a3 != i2))
        return r2 = k[d2], i2 = a3, r2(i2);
      if (i2 = a3, t2 != d2 && n2 != a3 && g2 in h) {
        t2 = d2, n2 = a3;
        const e3 = ((e4, t3) => t3.replace(/^((?:[^]*[^\w-])?)(fit-content|stretch)((?:[^\w-][^]*)?)$/, (t4, n3, r3, i3) => n3 + (r3 === "stretch" ? `-moz-available${i3};${e4}:${n3}-webkit-fill-available` : `-moz-fit-content${i3};${e4}:${n3}fit-content`) + i3))(g2, String(n2));
        if (e3 != a3)
          return { [o3]: e3 };
      }
      let p2 = s22 === 64 ? (o3.slice(1) in e2.media ? "@media " + e2.media[o3.slice(1)] : o3).replace(/\(\s*([\w-]+)\s*(=|<|<=|>|>=)\s*([\w-]+)\s*(?:(<|<=|>|>=)\s*([\w-]+)\s*)?\)/g, (e3, t3, n3, r3, i3, o4) => {
        const a4 = m.test(t3), l2 = 0.0625 * (a4 ? -1 : 1), [s3, d3] = a4 ? [r3, t3] : [t3, r3];
        return "(" + (n3[0] === "=" ? "" : n3[0] === ">" === a4 ? "max-" : "min-") + s3 + ":" + (n3[0] !== "=" && n3.length === 1 ? d3.replace(m, (e4, t4, r4) => Number(t4) + l2 * (n3 === ">" ? 1 : -1) + r4) : d3) + (i3 ? ") and (" + (i3[0] === ">" ? "min-" : "max-") + s3 + ":" + (i3.length === 1 ? o4.replace(m, (e4, t4, n4) => Number(t4) + l2 * (i3 === ">" ? -1 : 1) + n4) : o4) : "") + ")";
      }) : s22 === 36 ? (e2.prefix === "sx" ? "-" : "--" + e2.prefix) + o3.replace(/\$/g, "-") : o3;
      const b2 = typeof a3 == "object" && a3 ? a3 : typeof a3 == "number" && a3 && d2 in u ? String(a3) + "px" : ((e3, t3, n3) => t3.replace(/([+-])?((?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?)?(\$|--)([$\w-]+)/g, (t4, r3, i3, o4, a4) => o4 == "$" == !!i3 ? t4 : (r3 || o4 == "--" ? "calc(" : "") + "var(" + (o4 === "$" ? (n3.prefix === "sx" ? "-" : "--" + n3.prefix) + "-" + (a4.includes("$") ? "" : e3 in n3.themeMap ? n3.themeMap[e3] + "-" : "") + a4.replace(/\$/g, "-") : o4 + a4) + ")" + (r3 || o4 == "--" ? "*" + (r3 || "") + (i3 || "1") + ")" : "")))(d2, String(a3), e2);
      return a3 != b2 || g2 != p2 ? { [p2]: b2 } : null;
    });
  };
};
var { ownKeys: I } = Reflect;
var y = class extends Set {
  toString() {
    return c(this).join("");
  }
  get hasChanged() {
    const { size: e2 } = this;
    return () => e2 < this.size;
  }
};
var x = y;
y.prototype[e] = y.prototype.toString;
var w = "colors";
var z = "sizes";
var W = "space";
var E = { gap: W, gridGap: W, columnGap: W, gridColumnGap: W, rowGap: W, gridRowGap: W, inset: W, insetBlock: W, insetBlockEnd: W, insetBlockStart: W, insetInline: W, insetInlineEnd: W, insetInlineStart: W, margin: W, marginTop: W, marginRight: W, marginBottom: W, marginLeft: W, marginBlock: W, marginBlockEnd: W, marginBlockStart: W, marginInline: W, marginInlineEnd: W, marginInlineStart: W, padding: W, paddingTop: W, paddingRight: W, paddingBottom: W, paddingLeft: W, paddingBlock: W, paddingBlockEnd: W, paddingBlockStart: W, paddingInline: W, paddingInlineEnd: W, paddingInlineStart: W, top: W, right: W, bottom: W, left: W, scrollMargin: W, scrollMarginTop: W, scrollMarginRight: W, scrollMarginBottom: W, scrollMarginLeft: W, scrollMarginX: W, scrollMarginY: W, scrollMarginBlock: W, scrollMarginBlockEnd: W, scrollMarginBlockStart: W, scrollMarginInline: W, scrollMarginInlineEnd: W, scrollMarginInlineStart: W, scrollPadding: W, scrollPaddingTop: W, scrollPaddingRight: W, scrollPaddingBottom: W, scrollPaddingLeft: W, scrollPaddingX: W, scrollPaddingY: W, scrollPaddingBlock: W, scrollPaddingBlockEnd: W, scrollPaddingBlockStart: W, scrollPaddingInline: W, scrollPaddingInlineEnd: W, scrollPaddingInlineStart: W, fontSize: "fontSizes", background: w, backgroundColor: w, backgroundImage: w, border: w, borderBlock: w, borderBlockEnd: w, borderBlockStart: w, borderBottom: w, borderBottomColor: w, borderColor: w, borderInline: w, borderInlineEnd: w, borderInlineStart: w, borderLeft: w, borderLeftColor: w, borderRight: w, borderRightColor: w, borderTop: w, borderTopColor: w, caretColor: w, color: w, columnRuleColor: w, fill: w, outline: w, outlineColor: w, stroke: w, textDecorationColor: w, fontFamily: "fonts", fontWeight: "fontWeights", lineHeight: "lineHeights", letterSpacing: "letterSpacings", blockSize: z, minBlockSize: z, maxBlockSize: z, inlineSize: z, minInlineSize: z, maxInlineSize: z, width: z, minWidth: z, maxWidth: z, height: z, minHeight: z, maxHeight: z, flexBasis: z, gridTemplateColumns: z, gridTemplateRows: z, borderWidth: "borderWidths", borderTopWidth: "borderWidths", borderRightWidth: "borderWidths", borderBottomWidth: "borderWidths", borderLeftWidth: "borderWidths", borderStyle: "borderStyles", borderTopStyle: "borderStyles", borderRightStyle: "borderStyles", borderBottomStyle: "borderStyles", borderLeftStyle: "borderStyles", borderRadius: "radii", borderTopLeftRadius: "radii", borderTopRightRadius: "radii", borderBottomRightRadius: "radii", borderBottomLeftRadius: "radii", boxShadow: "shadows", textShadow: "shadows", transition: "transitions", zIndex: "zIndices" };
var R = (e2, t2) => {
  for (var n2 = JSON.stringify(t2), r2 = n2.length, i2 = 9; r2; )
    i2 = Math.imul(i2 ^ n2.charCodeAt(--r2), 9 ** 9);
  return e2 + (i2 ^ i2 >>> 9).toString(36).slice(-5);
};
var M = (e2) => e2 ? "-" + e2 : "";
var C = class {
  constructor(e2, t2, n2 = "", r2 = "") {
    this.value = e2, this.token = t2, this.scale = n2, this.prefix = r2;
  }
  get computedValue() {
    return "var(" + this.variable + ")";
  }
  get variable() {
    return "-" + M(this.prefix) + M(this.scale) + "-" + this.token;
  }
  toString() {
    return this.computedValue;
  }
};
var P = class extends Array {
  toString() {
    return this.join("");
  }
  get hasChanged() {
    const e2 = String(this);
    return () => e2 !== String(this);
  }
};
var T = P;
P.prototype[e] = P.prototype.toString;
var v = (e2) => {
  let t2, r2, i2, o2, a2, l2 = false;
  const s22 = e2.insertionMethod === "append" ? "append" : "prepend";
  return (e3) => {
    typeof document == "object" && (t2 || (t2 = document.head || document.documentElement), r2 || (r2 = document.getElementById("stitches") || n(document.createElement("style"), { id: "stitches", textContent: e3 })), i2 || (i2 = r2.firstChild || new Text(), l2 = !i2.data), o2 || (o2 = r2.insertBefore(new Text(), i2)), r2.isConnected || t2[s22](r2), o2.data = e3, !l2 && e3 && (clearTimeout(a2), a2 = setTimeout(() => {
      i2.remove(), l2 = true;
    }, 250)));
  };
};
var j = (e2) => {
  e2 = typeof e2 == "object" && e2 || {};
  const i2 = {};
  i2.media = n({ initial: "all" }, e2.media), i2.theme = typeof e2.theme == "object" && e2.theme || {}, i2.themeMap = typeof e2.themeMap == "object" && e2.themeMap || E, i2.utils = typeof e2.utils == "object" && e2.utils || {};
  const o2 = new Set(e2.passthru ? [...e2.passthru, "as", "className"] : ["as", "className"]), l2 = i2.prefix = e2.prefix || "sx";
  i2.insertionMethod = e2.insertionMethod || "prepend";
  const s22 = (typeof i2.insertionMethod == "function" ? i2.insertionMethod : v)(i2), d2 = "03kze", g2 = B(i2), p2 = new x(), m2 = new x(), h2 = new x(), u2 = new x(), b2 = new x([p2, m2, h2, u2]);
  let f2 = "";
  const S2 = () => {
    const e3 = c(b2).join("");
    f2 !== e3 && s22(f2 = e3);
  }, k2 = (e3, t2) => {
    t2 = typeof e3 == "object" && e3 || Object(t2);
    const n2 = (e3 = typeof e3 == "string" ? e3 : "") !== "root", i3 = (n2 ? "." : ":root,.") + (e3 = n2 && e3 || R(l2, t2)), o3 = a(r(null), "className", { className: e3, selector: i3 }), s3 = {}, c2 = s3[i3] = {};
    for (const e4 in t2) {
      o3[e4] = r(null);
      for (const n3 in t2[e4]) {
        let r2 = String(t2[e4][n3]);
        r2.includes("$") && (r2 = r2.replace(/\$([$\w-]+)/g, (t3, n4) => n4.includes("$") ? t3 : "$" + e4 + t3));
        const i4 = o3[e4][n3] = new C(r2, n3, e4, l2 === "sx" ? "" : l2);
        c2[i4.variable] = i4.value;
      }
    }
    const p3 = e3 === l2 + d2 ? "" : g2(s3);
    return a(o3, "className", { get className() {
      const { hasChanged: t3 } = m2;
      return m2.add(p3), t3() && S2(), e3;
    }, selector: i3 });
  }, y2 = (e3, t2 = "") => {
    const n2 = new x(), i3 = new x();
    for (const t3 in e3)
      if (e3[t3] !== Object(e3[t3]) || I(e3[t3]).length) {
        const r2 = g2({ [t3]: e3[t3] });
        (t3 === "@import" ? n2 : i3).add(r2);
      }
    const o3 = a(r(null), "name", { name: t2 }), l3 = a(() => {
      let e4 = p2.hasChanged, t3 = h2.hasChanged;
      return n2.forEach((e5) => {
        p2.add(e5);
      }), i3.forEach((e5) => {
        h2.add(e5);
      }), (e4() || t3()) && S2(), o3;
    }, "name", { get name() {
      return String(l3());
    } });
    return l3;
  }, w2 = (e3) => {
    const t2 = new x(), n2 = new T(), i3 = new x(), o3 = new x([t2, n2, i3]);
    let { variants: a2, compoundVariants: s3, defaultVariants: c2, ...p3 } = e3;
    c2 = Object(c2);
    const m3 = R(l2, e3), h3 = "." + m3, b3 = m3 === l2 + d2 ? "" : g2({ [h3]: p3 });
    u2.add(o3);
    const f3 = r(null), S3 = [], k3 = [];
    for (const e4 in a2)
      for (const t3 in a2[e4]) {
        const n3 = a2[e4][t3];
        k3.push({ [e4]: t3, css: n3 });
      }
    k3.push(...s3 || []);
    for (const e4 in k3) {
      const { css: t3, ...i4 } = k3[e4], o4 = I(i4), a3 = o4.length;
      for (const e5 of o4)
        f3[e5] = f3[e5] || r(null), f3[e5][i4[e5]] = true;
      const l3 = (e5, r2) => {
        e5 = { ...e5 };
        for (const t4 in r2)
          e5[t4] !== void 0 || Object(f3[t4])[e5[t4]] || (e5[t4] = r2[t4]);
        const l4 = new Set();
        if (o4.length && o4.every((t4) => {
          const n3 = e5[t4], r3 = String(i4[t4]);
          if (r3 === String(n3))
            return true;
          if (n3 === Object(n3)) {
            for (const e6 in n3)
              if (r3 == String(n3[e6]) && e6.charCodeAt(0) === 64)
                return l4.add(e6), true;
          }
        })) {
          let e6 = Object(t3);
          for (const t4 of l4)
            e6 = { [t4]: e6 };
          const r3 = m3 + R("", e6) + "--" + (a3 === 1 ? o4[0] + "-" + i4[o4[0]] : "c" + a3), s4 = g2({ ["." + r3]: e6 });
          return (n2[a3 - 1] || (n2[a3 - 1] = new x())).add(s4), r3;
        }
      };
      S3.push(l3);
    }
    return { apply(e4, r2, i4) {
      const a3 = t2.hasChanged, l3 = n2.hasChanged;
      if (t2.add(b3), e4) {
        r2.add(m3);
        for (const t3 of S3) {
          const n3 = t3(e4, i4);
          n3 && r2.add(n3);
        }
      }
      if (a3() || l3())
        return u2.add(o3), true;
    }, inline(e4, t3) {
      const n3 = R("-", e4), r2 = m3 === "-" + n3 ? "" : g2({ [h3 + n3]: e4 });
      t3.add(m3 + n3);
      const { hasChanged: o4 } = i3;
      return r2 && i3.add(r2), o4();
    }, className: m3, defaultVariants: c2, selector: h3, variantProps: f3 };
  }, z2 = k2("root", i2.theme), W2 = a({ css: (...e3) => {
    let i3, l3 = [], s3 = r(null);
    for (const r2 of e3)
      if (r2 === Object(r2))
        if (t in r2)
          for (const e4 of r2[t])
            l3.push(e4), n(s3, e4.defaultVariants);
        else
          l3.push(i3 = w2(r2)), n(s3, i3.defaultVariants);
    return i3 || l3.push(i3 = w2({})), a((e4) => {
      const { css: n2, ...d3 } = Object(e4), g3 = new Set();
      let p3, m3 = false;
      for (const e5 of l3)
        m3 = e5.apply(d3, g3, s3) || m3;
      n2 === Object(n2) && (p3 = i3.inline(n2, g3)), (m3 || p3) && S2();
      for (const e5 in i3.variantProps)
        o2.has(e5) || delete d3[e5];
      d3.className !== void 0 && String(d3.className).split(/\s+/).forEach(g3.add, g3);
      const h3 = c(g3);
      return d3.className = h3.join(" "), a(r(null), "className", { get [t]() {
        return l3;
      }, className: d3.className, props: d3, selector: i3.selector });
    }, "className", { get [t]() {
      return l3;
    }, get className() {
      return i3.apply() && S2(), i3.className;
    }, selector: i3.selector });
  }, config: i2, global: y2, keyframes: (e3) => {
    const t2 = R(l2, e3);
    return y2({ ["@keyframes " + t2]: e3 }, t2);
  }, prefix: l2, reset: () => (p2.clear(), m2.clear(), h2.clear(), u2.clear(), z2.className, W2), theme: n(k2, z2), get cssText() {
    return f2;
  }, getCssString: () => f2 }, "cssText", {});
  return W2;
};
var {
  css: css$4,
  global: globalCSS,
  keyframes,
  getCssString,
  theme
} = j({
  theme: {
    colors: {
      black: "rgba(19, 19, 21, 1)",
      white: "rgba(255, 255, 255, 1)",
      gray: "rgba(128, 128, 128, 1)",
      blue: "rgba(3, 136, 252, 1)",
      red: "#D51742",
      yellow: "rgba(255, 221, 0, 1)",
      pink: "rgba(232, 141, 163, 1)",
      turq: "rgba(0, 245, 196, 1)",
      orange: "rgba(255, 135, 31, 1)",
      lightGray: "#e1e1e1",
      offwhite: "#ededed"
    },
    fontSizes: {
      1: "12px",
      2: "14px",
      3: "16px",
      4: "20px",
      5: "24px",
      6: "32px",
      7: "48px",
      8: "64px",
      9: "72px"
    },
    sizes: {
      maxWidth: "1000px"
    },
    shadows: {
      boxShadow: "0 12px 24px 0 rgba(0,0,0,0.09)"
    }
  },
  media: {
    bp1: "(min-width: 575px)",
    bp2: "(min-width: 750px)",
    bp3: "(min-width: 1000px)",
    bp4: "(min-width: 1200px)"
  },
  utils: {
    p: (config) => (value) => ({
      paddingTop: value,
      paddingBottom: value,
      paddingLeft: value,
      paddingRight: value
    }),
    pt: (config) => (value) => ({
      paddingTop: value
    }),
    pr: (config) => (value) => ({
      paddingRight: value
    }),
    pb: (config) => (value) => ({
      paddingBottom: value
    }),
    pl: (config) => (value) => ({
      paddingLeft: value
    }),
    px: (config) => (value) => ({
      paddingLeft: value,
      paddingRight: value
    }),
    py: (config) => (value) => ({
      paddingTop: value,
      paddingBottom: value
    }),
    m: (config) => (value) => ({
      marginTop: value,
      marginBottom: value,
      marginLeft: value,
      marginRight: value
    }),
    mt: (config) => (value) => ({
      marginTop: value
    }),
    mr: (config) => (value) => ({
      marginRight: value
    }),
    mb: (config) => (value) => ({
      marginBottom: value
    }),
    ml: (config) => (value) => ({
      marginLeft: value
    }),
    mx: (config) => (value) => ({
      marginLeft: value,
      marginRight: value
    }),
    my: (config) => (value) => ({
      marginTop: value,
      marginBottom: value
    }),
    bc: (config) => (value) => ({
      backgroundColor: value
    })
  },
  prefix: "",
  themeMap: {}
});
var itemStyles = css$4({
  background: "$colors$white",
  border: "1px solid $colors$offWhite",
  boxShadow: "$shadows$boxShadow",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  img: {
    width: "100%",
    height: "400px",
    objectFit: "cover"
  },
  p: {
    lineHeight: "2",
    fontWeight: "300",
    "flex-grow": "1",
    padding: " 0 3rem",
    fontSize: "$fontSizes$3"
  },
  ".buttonList": {
    display: "grid",
    width: "100%",
    borderTop: "1px solid $colors$lightGray",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gridGap: "1px",
    background: "$colors$lightGray",
    "& > *": {
      background: "$colors$white",
      border: "0",
      color: "$colors$black",
      fontSize: "$fontSizes$1",
      padding: "1rem"
    }
  }
});
var css$3 = {
  code: "h1.svelte-n7pqxo{margin:0 1rem;text-align:center;transform:skew(-5deg) rotate(-1deg);margin-top:-3rem;text-shadow:2px 2px 0 rgba(0, 0, 0, 0.1)}a.svelte-n7pqxo{background:var(--colors-red);display:inline;line-height:1.3;font-size:4rem;color:var(--colors-white);text-align:center;padding:0 1rem}p.svelte-n7pqxo{padding:0 1rem}.pricetag.svelte-n7pqxo{background:var(--colors-red);transform:rotate(3deg);color:var(--colors-white);font-weight:600;padding:5px;line-height:1;font-size:3rem;display:inline-block;position:absolute;top:-3px;right:-3px}",
  map: '{"version":3,"file":"Product.svelte","sources":["Product.svelte"],"sourcesContent":["<script>\\n  import formatMoney from \\"$lib/formatMoney\\";\\n  import { itemStyles } from \\"$lib/styles/ItemStyles\\";\\n\\n  export let product;\\n<\/script>\\n\\n<div class={itemStyles()}>\\n  <img src={product?.photo?.image?.publicUrlTransformed} alt={product.name} />\\n  <h1>\\n    <a sveltekit:prefetch href={`/product/${product.id}`}>{product.name}</a>\\n  </h1>\\n  <span class=\\"pricetag\\">{formatMoney(product.price)}</span>\\n  <p>{product.description}</p>\\n  <div class=\\"buttonList\\">\\n    <a\\n      sveltekit:prefetch\\n      href={{\\n        pathname: \\"/update\\",\\n        query: {\\n          id: product.id,\\n        },\\n      }}\\n    >\\n      Edit Product\\n    </a>\\n    <!-- <AddToCart id={product.id} />\\n    <DeleteProduct id={product.id}>Delete</DeleteProduct> -->\\n  </div>\\n</div>\\n\\n<style>\\n  h1 {\\n    margin: 0 1rem;\\n    text-align: center;\\n    transform: skew(-5deg) rotate(-1deg);\\n    margin-top: -3rem;\\n    text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);\\n  }\\n  a {\\n    background: var(--colors-red);\\n    display: inline;\\n    line-height: 1.3;\\n    font-size: 4rem;\\n    color: var(--colors-white);\\n    text-align: center;\\n    padding: 0 1rem;\\n  }\\n\\n  p {\\n    padding: 0 1rem;\\n  }\\n\\n  .pricetag {\\n    background: var(--colors-red);\\n    transform: rotate(3deg);\\n    color: var(--colors-white);\\n    font-weight: 600;\\n    padding: 5px;\\n    line-height: 1;\\n    font-size: 3rem;\\n    display: inline-block;\\n    position: absolute;\\n    top: -3px;\\n    right: -3px;\\n  }\\n</style>\\n"],"names":[],"mappings":"AAgCE,EAAE,cAAC,CAAC,AACF,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,UAAU,CAAE,MAAM,CAClB,SAAS,CAAE,KAAK,KAAK,CAAC,CAAC,OAAO,KAAK,CAAC,CACpC,UAAU,CAAE,KAAK,CACjB,WAAW,CAAE,GAAG,CAAC,GAAG,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AAC3C,CAAC,AACD,CAAC,cAAC,CAAC,AACD,UAAU,CAAE,IAAI,YAAY,CAAC,CAC7B,OAAO,CAAE,MAAM,CACf,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,IAAI,cAAc,CAAC,CAC1B,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,CAAC,CAAC,IAAI,AACjB,CAAC,AAED,CAAC,cAAC,CAAC,AACD,OAAO,CAAE,CAAC,CAAC,IAAI,AACjB,CAAC,AAED,SAAS,cAAC,CAAC,AACT,UAAU,CAAE,IAAI,YAAY,CAAC,CAC7B,SAAS,CAAE,OAAO,IAAI,CAAC,CACvB,KAAK,CAAE,IAAI,cAAc,CAAC,CAC1B,WAAW,CAAE,GAAG,CAChB,OAAO,CAAE,GAAG,CACZ,WAAW,CAAE,CAAC,CACd,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,YAAY,CACrB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,IAAI,CACT,KAAK,CAAE,IAAI,AACb,CAAC"}'
};
var Product = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  var _a, _b;
  let { product } = $$props;
  if ($$props.product === void 0 && $$bindings.product && product !== void 0)
    $$bindings.product(product);
  $$result.css.add(css$3);
  return `<div class="${escape2(null_to_empty(itemStyles())) + " svelte-n7pqxo"}"><img${add_attribute("src", (_b = (_a = product == null ? void 0 : product.photo) == null ? void 0 : _a.image) == null ? void 0 : _b.publicUrlTransformed, 0)}${add_attribute("alt", product.name, 0)}>
  <h1 class="${"svelte-n7pqxo"}"><a sveltekit:prefetch${add_attribute("href", `/product/${product.id}`, 0)} class="${"svelte-n7pqxo"}">${escape2(product.name)}</a></h1>
  <span class="${"pricetag svelte-n7pqxo"}">${escape2(formatMoney(product.price))}</span>
  <p class="${"svelte-n7pqxo"}">${escape2(product.description)}</p>
  <div class="${"buttonList"}"><a sveltekit:prefetch${add_attribute("href", {
    pathname: "/update",
    query: { id: product.id }
  }, 0)} class="${"svelte-n7pqxo"}">Edit Product
    </a>
    </div>
</div>`;
});
var css$2 = {
  code: ".product-list.svelte-1mapues{display:grid;grid-template-columns:1fr 1fr;grid-gap:60px}",
  map: '{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script context=\\"module\\">\\n  export async function load({ context }) {\\n    let { client } = context;\\n\\n    const GET_ALL = `\\n               query {\\n                    allProducts (sortBy: [name_ASC]) {\\n                        id\\n                        name\\n                        description\\n                        photo {\\n                            id\\n                            image {\\n                                id\\n                                publicUrlTransformed\\n                                }\\n                            }\\n                            price\\n                        }\\n                    }`;\\n    let listProducts = await client.query(GET_ALL).toPromise();\\n\\n    return { props: { listProducts } };\\n  }\\n<\/script>\\n\\n<script>\\n  import Product from \\"$lib/components/Product.svelte\\";\\n\\n  export let listProducts;\\n  $: ({ data, error } = listProducts);\\n<\/script>\\n\\n<svelte:head>\\n  <title>Sick Fits</title>\\n</svelte:head>\\n\\n{#if error}\\n  <p>Oh no... {error.message}</p>\\n{:else}\\n  <div class=\\"product-list\\">\\n    {#each data?.allProducts as product}\\n      <Product {product} />\\n    {/each}\\n  </div>\\n{/if}\\n\\n<style>\\n  .product-list {\\n    display: grid;\\n    grid-template-columns: 1fr 1fr;\\n    grid-gap: 60px;\\n  }\\n</style>\\n"],"names":[],"mappings":"AAgDE,aAAa,eAAC,CAAC,AACb,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,GAAG,CAAC,GAAG,CAC9B,QAAQ,CAAE,IAAI,AAChB,CAAC"}'
};
async function load$2({ context }) {
  let { client } = context;
  const GET_ALL = `
               query {
                    allProducts (sortBy: [name_ASC]) {
                        id
                        name
                        description
                        photo {
                            id
                            image {
                                id
                                publicUrlTransformed
                                }
                            }
                            price
                        }
                    }`;
  let listProducts = await client.query(GET_ALL).toPromise();
  return { props: { listProducts } };
}
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let data;
  let error22;
  let { listProducts } = $$props;
  if ($$props.listProducts === void 0 && $$bindings.listProducts && listProducts !== void 0)
    $$bindings.listProducts(listProducts);
  $$result.css.add(css$2);
  ({ data, error: error22 } = listProducts);
  return `${$$result.head += `${$$result.title = `<title>Sick Fits</title>`, ""}`, ""}

${error22 ? `<p>Oh no... ${escape2(error22.message)}</p>` : `<div class="${"product-list svelte-1mapues"}">${each(data == null ? void 0 : data.allProducts, (product) => `${validate_component(Product, "Product").$$render($$result, { product }, {}, {})}`)}</div>`}`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes,
  load: load$2
});
var css$1 = {
  code: ".error.svelte-1y8ikz8{padding:2rem;background:white;margin:2rem 0;border:1px solid rgba(0, 0, 0, 0.05);border-left:5px solid red}p.svelte-1y8ikz8{margin:0;font-weight:100}strong.svelte-1y8ikz8{margin-right:1rem}",
  map: '{"version":3,"file":"ErrorMessage.svelte","sources":["ErrorMessage.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let error;\\r\\n<\/script>\\n\\n<!-- {#if error.networkError && error.networkError.result && error.networkError.result.errors.length}\\n    {#each error.networkError.result.errors as error} -->\\n<div class=\\"error\\">\\n    <p data-test=\\"graphql-error\\">\\n        <strong>Shoot!</strong>\\n        {error}\\n    </p>\\n</div>\\n\\n<!-- {/each}\\n{/if} -->\\n<style>\\n    .error {\\n        padding: 2rem;\\n        background: white;\\n        margin: 2rem 0;\\n        border: 1px solid rgba(0, 0, 0, 0.05);\\n        border-left: 5px solid red;\\n    }\\n    p {\\n        margin: 0;\\n        font-weight: 100;\\n    }\\n    strong {\\n        margin-right: 1rem;\\n    }\\n</style>\\n"],"names":[],"mappings":"AAeI,MAAM,eAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,KAAK,CACjB,MAAM,CAAE,IAAI,CAAC,CAAC,CACd,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CACrC,WAAW,CAAE,GAAG,CAAC,KAAK,CAAC,GAAG,AAC9B,CAAC,AACD,CAAC,eAAC,CAAC,AACC,MAAM,CAAE,CAAC,CACT,WAAW,CAAE,GAAG,AACpB,CAAC,AACD,MAAM,eAAC,CAAC,AACJ,YAAY,CAAE,IAAI,AACtB,CAAC"}'
};
var ErrorMessage = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { error: error22 } = $$props;
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  $$result.css.add(css$1);
  return `
<div class="${"error svelte-1y8ikz8"}"><p data-test="${"graphql-error"}" class="${"svelte-1y8ikz8"}"><strong class="${"svelte-1y8ikz8"}">Shoot!</strong>
        ${escape2(error22)}</p></div>

`;
});
var paginationStyles = css$4({
  textAlign: "center",
  display: "inline-grid",
  gridTemplateColumns: "repeat(4, auto)",
  alignItems: "stretch",
  justifyContent: "center",
  alignContent: "center",
  marginBottom: "4rem",
  border: "1px solid $colors$lightGray",
  borderRadius: "10px",
  "&:last-child": {
    marginTop: "4rem"
  },
  "& > *": {
    m: "0",
    px: "30px",
    py: "5px",
    borderRight: "1px solid $colors$lightGray",
    "&:last-child": {
      borderRight: "0"
    }
  },
  "a:hover": {
    textDecoration: "none",
    color: "$colors$red"
  },
  'a[aria-disabled="true"]': {
    color: "$colors$grey",
    pointerEvents: "none"
  }
});
var Pagination = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let count;
  let PageCount;
  let $PAGINATION_QUERY, $$unsubscribe_PAGINATION_QUERY;
  var _a;
  let { page: page2 = 1 } = $$props;
  const PAGINATION_QUERY = operationStore(`
    query PAGINATION_QUERY {
      _allProductsMeta {
        
        count
      }
    }
  `);
  $$unsubscribe_PAGINATION_QUERY = subscribe(PAGINATION_QUERY, (value) => $PAGINATION_QUERY = value);
  query(PAGINATION_QUERY);
  if ($$props.page === void 0 && $$bindings.page && page2 !== void 0)
    $$bindings.page(page2);
  count = (_a = $PAGINATION_QUERY.data) === null || _a === void 0 ? void 0 : _a._allProductsMeta.count;
  PageCount = Math.ceil(count / perPage);
  $$unsubscribe_PAGINATION_QUERY();
  return `${$$result.head += `${$$result.title = `<title>
        Sick Fits - Page ${escape2(page2)} of ${escape2(PageCount)}
    </title>`, ""}`, ""}

${$PAGINATION_QUERY.error ? `${validate_component(ErrorMessage, "DisplayError").$$render($$result, { error: $PAGINATION_QUERY.error.message }, {}, {})}` : `<div${add_attribute("class", paginationStyles(), 0)}><a sveltekit:prefetch${add_attribute("href", `/products/${+page2 - 1}`, 0)}${add_attribute("aria-disabled", page2 <= 1, 0)}>Prev
        </a>
        <p>Page ${escape2(page2)} of ${escape2(PageCount)}</p>
        <p>${escape2(count)} Items Total</p>
        <a sveltekit:prefetch${add_attribute("href", `/products/${+page2 + 1}`, 0)}${add_attribute("aria-disabled", page2 >= PageCount, 0)}>Next</a></div>`}`;
});
var css = {
  code: ".product-list.svelte-1dezbjo{display:grid;grid-template-columns:1fr 1fr;grid-gap:60px}",
  map: '{"version":3,"file":"Products.svelte","sources":["Products.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Product from \\"$lib/components/Product.svelte\\";\\r\\nexport let allProduct;\\r\\n$: ({ data, error } = allProduct);\\r\\n$: console.log(data);\\r\\n<\/script>\\n\\n<svelte:head>\\n    <title>Sick Fits</title>\\n</svelte:head>\\n\\n{#if error}\\n    <p>Oh no... {error.message}</p>\\n{:else}\\n    <div class=\\"product-list\\">\\n        {#each data?.allProducts as product}\\n            <Product {product} />\\n        {/each}\\n    </div>\\n{/if}\\n\\n<style>\\n    .product-list {\\n        display: grid;\\n        grid-template-columns: 1fr 1fr;\\n        grid-gap: 60px;\\n    }\\n</style>\\n"],"names":[],"mappings":"AAqBI,aAAa,eAAC,CAAC,AACX,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,GAAG,CAAC,GAAG,CAC9B,QAAQ,CAAE,IAAI,AAClB,CAAC"}'
};
var Products = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let data;
  let error22;
  let { allProduct } = $$props;
  if ($$props.allProduct === void 0 && $$bindings.allProduct && allProduct !== void 0)
    $$bindings.allProduct(allProduct);
  $$result.css.add(css);
  ({ data, error: error22 } = allProduct);
  {
    console.log(data);
  }
  return `${$$result.head += `${$$result.title = `<title>Sick Fits</title>`, ""}`, ""}

${error22 ? `<p>Oh no... ${escape2(error22.message)}</p>` : `<div class="${"product-list svelte-1dezbjo"}">${each(data == null ? void 0 : data.allProducts, (product) => `${validate_component(Product, "Product").$$render($$result, { product }, {}, {})}`)}</div>`}`;
});
var load$1 = async ({ page: page2, context }) => {
  let { id } = page2.params;
  let { client } = context;
  console.log("Conetxt", { context, id });
  const GET_TASKS = `
               query ALL_PRODUCTS_QUERY($skip: Int = 0, $first: Int) {
                    allProducts(first: $first, skip: $skip, sortBy: [name_ASC]) {
                        id
                        name
                        description
                        photo {
                            id
                            image {
                                id
                                publicUrlTransformed
                                }
                            }
                            price
                        }
                    }`;
  let allProduct = await client.query(GET_TASKS, { skip: id * 4 - 4, first: 4 }, { requestPolicy: "network-only" }).toPromise();
  console.log(allProduct);
  return { props: { id, allProduct } };
};
var U5Bidu5D$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { id } = $$props;
  let { allProduct } = $$props;
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  if ($$props.allProduct === void 0 && $$bindings.allProduct && allProduct !== void 0)
    $$bindings.allProduct(allProduct);
  return `<div>${validate_component(Pagination, "Pagination").$$render($$result, { page: id || 1 }, {}, {})}
    ${validate_component(Products, "Products").$$render($$result, { allProduct }, {}, {})}
    ${validate_component(Pagination, "Pagination").$$render($$result, { page: id || 1 }, {}, {})}</div>`;
});
var _id_$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": U5Bidu5D$1,
  load: load$1
});
var SingleProduct = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $SINGLE_ITEM_QUERY, $$unsubscribe_SINGLE_ITEM_QUERY;
  let { id } = $$props;
  const productStyles = css$4({
    display: "grid",
    gridAutoColumns: "1fr",
    gridAutoFlow: "column",
    maxWidth: "$sizes$maxWidth",
    justifyContent: "center",
    alignItems: "top",
    gap: "2rem",
    img: { width: "100%", objectFit: "contain" }
  });
  const SINGLE_ITEM_QUERY = operationStore(`
    query SINGLE_ITEM_QUERY($id: ID!) {
        Product(where: { id: $id }) {
            name
            price
            description
            photo {
                altText
                image {
                    publicUrlTransformed
                }
            }
        }
    }
    `, { id });
  $$unsubscribe_SINGLE_ITEM_QUERY = subscribe(SINGLE_ITEM_QUERY, (value) => $SINGLE_ITEM_QUERY = value);
  query(SINGLE_ITEM_QUERY);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  $$unsubscribe_SINGLE_ITEM_QUERY();
  return `${$$result.head += `${$$result.title = `<title>${escape2(`Sick Fits ${!$SINGLE_ITEM_QUERY.fetching ? `| ${$SINGLE_ITEM_QUERY.data.Product.name}` : ""}`)}</title>`, ""}`, ""}

${$SINGLE_ITEM_QUERY.fetching ? `<p>Loading...</p>` : `${$SINGLE_ITEM_QUERY.error ? `${validate_component(ErrorMessage, "DisplayError").$$render($$result, { error: $SINGLE_ITEM_QUERY.error }, {}, {})}` : `<div${add_attribute("class", productStyles(), 0)}><img${add_attribute("src", $SINGLE_ITEM_QUERY.data.Product.photo.image.publicUrlTransformed, 0)}${add_attribute("alt", $SINGLE_ITEM_QUERY.data.Product.photo.altText, 0)}>
        <div class="${"details"}"><h2>${escape2($SINGLE_ITEM_QUERY.data.Product.name)}</h2>
            <p>${escape2($SINGLE_ITEM_QUERY.data.Product.description)}</p></div></div>`}`}`;
});
var load = async ({ page: page2, fetch: fetch2 }) => {
  let { id } = page2.params;
  return { props: { id } };
};
var U5Bidu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { id } = $$props;
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  return `${validate_component(SingleProduct, "SingleProduct").$$render($$result, { id }, {}, {})}`;
});
var _id_ = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": U5Bidu5D,
  load
});
var loading = keyframes({
  from: {
    backgroundPosition: "0 0"
  },
  to: {
    backgroundPosition: "100% 100%"
  }
});
var forms = css$4({
  boxShadow: "0 0 5px 3px rgba(0, 0, 0, 0.05)",
  background: "rgba(0, 0, 0, 0.02)",
  border: "5px solid $color$white",
  padding: "20px",
  fontSize: "$fontSizes$2",
  lineHeight: 1.5,
  fontWeight: 600,
  label: {
    display: "block",
    mb: "$fontSizes$1"
  },
  "input, textarea, select": {
    width: "100%",
    padding: "0.5rem",
    fontSize: "$fontSizes$1",
    border: "1px solid $colors$black",
    "&:focus": {
      outline: 0,
      borderColor: "$color$red"
    }
  },
  "button, input[type='submit']": {
    width: "auto",
    background: "red",
    color: "white",
    border: 0,
    fontSize: "$fontSizes$4",
    fontWeight: "600",
    padding: "0.5rem 1.2rem"
  },
  fieldset: {
    border: 0,
    padding: 0,
    "&[disabled]": {
      opacity: 0.5
    },
    "&::before": {
      height: "10px",
      content: "",
      display: "block",
      backgroundImage: `linear-gradient(
                to right,
                #ff3019 0%,
                #e2b04a 50%,
                #ff3019 100%
                )`
    },
    "&[aria-busy='true']::before": {
      backgroundSize: "50% auto",
      animation: `${loading} 0.5s linear infinite`
    }
  }
});
var CreateProduct = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  (function(thisArg, _arguments, P2, generator) {
    function adopt(value) {
      return value instanceof P2 ? value : new P2(function(resolve2) {
        resolve2(value);
      });
    }
    return new (P2 || (P2 = Promise))(function(resolve2, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e2) {
          reject(e2);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e2) {
          reject(e2);
        }
      }
      function step(result2) {
        result2.done ? resolve2(result2.value) : adopt(result2.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  });
  let input = {
    name: "Nice Shoe",
    price: 34,
    description: "test"
  };
  let result = {};
  let data = {
    key: 1,
    query: gql`
      mutation(
        $name: String!
        $description: String!
        $price: Int!
        $image: Upload!
      ) {
        createProduct(
          data: {
            name: $name
            description: $description
            price: $price
            status: "AVAILABLE"
            photo: { create: { image: $image, altText: $name } }
          }
        ) {
          id
          price
          description
          name
        }
      }
    `
  };
  mutation(data);
  return `<form${add_attribute("class", forms(), 0)}>${``}
  <fieldset ${""}${add_attribute("aria-busy", result.fetching, 0)}><label for="${"image"}">Image
      <input required type="${"file"}" id="${"image"}" name="${"image"}"></label>
    <label for="${"name"}">Name
      <input type="${"text"}" id="${"name"}" name="${"name"}" placeholder="${"name"}"${add_attribute("value", input.name, 0)}></label>
    <label for="${"price"}">Price
      <input type="${"number"}" id="${"price"}" name="${"price"}" placeholder="${"price"}"${add_attribute("value", input.price, 0)}></label>
    <label for="${"description"}">Description
      <textarea id="${"description"}" name="${"description"}" placeholder="${"description"}">${input.description}</textarea></label>
    <button type="${"submit"}">+ Add Product</button></fieldset></form>`;
});
var Sell = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(CreateProduct, "CreateProduct").$$render($$result, {}, {}, {})}`;
});
var sell = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Sell
});

// .svelte-kit/vercel/entry.js
init();
var entry_default = async (req, res) => {
  const { pathname, searchParams } = new URL(req.url || "", "http://localhost");
  let body;
  try {
    body = await getRawBody(req);
  } catch (err) {
    res.statusCode = err.status || 400;
    return res.end(err.reason || "Invalid request body");
  }
  const rendered = await render({
    method: req.method,
    headers: req.headers,
    path: pathname,
    query: searchParams,
    rawBody: body
  });
  if (rendered) {
    const { status, headers, body: body2 } = rendered;
    return res.writeHead(status, headers).end(body2);
  }
  return res.writeHead(404).end();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
