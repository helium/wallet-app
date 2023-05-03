/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-classes-per-file */
declare module '*.svg' {
  import { SvgProps } from 'react-native-svg'

  const content: React.FC<SvgProps>
  export default content
}

declare module '*.mp4'

declare module 'angry-purple-tiger' {
  export default function fn(value: string): string
}

declare module 'react-native-currency-format' {
  export function format(value: number, currencyType: string): Promise<string>
}

declare module 'react-native-icloudstore' {
  /**
   * AsyncStorage is a simple, unencrypted, asynchronous, persistent, key-value storage
   * system that is global to the app.  It should be used instead of LocalStorage.
   *
   * It is recommended that you use an abstraction on top of `AsyncStorage`
   * instead of `AsyncStorage` directly for anything more than light usage since
   * it operates globally.
   *
   * On iOS, `AsyncStorage` is backed by native code that stores small values in a
   * serialized dictionary and larger values in separate files. On Android,
   * `AsyncStorage` will use either [RocksDB](http://rocksdb.org/) or SQLite
   * based on what is available.
   *
   * @see https://github.com/react-native-async-storage/react-native-async-storage/blob/master/docs/API.md
   */
  export interface AsyncStorageStatic {
    /**
     * Fetches key and passes the result to callback, along with an Error if there is any.
     */
    getItem(
      key: string,
      callback?: (error?: Error, result?: string) => void,
    ): Promise<string | null>

    /**
     * Sets value for key and calls callback on completion, along with an Error if there is any
     */
    setItem(
      key: string,
      value: string,
      callback?: (error?: Error) => void,
    ): Promise<void>

    removeItem(key: string, callback?: (error?: Error) => void): Promise<void>

    /**
     * Merges existing value with input value, assuming they are stringified json. Returns a Promise object.
     * Not supported by all native implementation
     */
    mergeItem(
      key: string,
      value: string,
      callback?: (error?: Error) => void,
    ): Promise<void>

    /**
     * Erases all AsyncStorage for all clients, libraries, etc. You probably don't want to call this.
     * Use removeItem or multiRemove to clear only your own keys instead.
     */
    clear(callback?: (error?: Error) => void): Promise<void>

    /**
     * Gets all keys known to the app, for all callers, libraries, etc
     */
    getAllKeys(
      callback?: (error?: Error, keys?: string[]) => void,
    ): Promise<string[]>

    /**
     * multiGet invokes callback with an array of key-value pair arrays that matches the input format of multiSet
     */
    multiGet(
      keys: string[],
      callback?: (errors?: Error[], result?: [string, string | null][]) => void,
    ): Promise<[string, string | null][]>

    /**
     * multiSet and multiMerge take arrays of key-value array pairs that match the output of multiGet,
     *
     * multiSet([['k1', 'val1'], ['k2', 'val2']], cb);
     */
    multiSet(
      keyValuePairs: string[][],
      callback?: (errors?: Error[]) => void,
    ): Promise<void>

    /**
     * Delete all the keys in the keys array.
     */
    multiRemove(
      keys: string[],
      callback?: (errors?: Error[]) => void,
    ): Promise<void>

    /**
     * Merges existing values with input values, assuming they are stringified json.
     * Returns a Promise object.
     *
     * Not supported by all native implementations.
     */
    multiMerge(
      keyValuePairs: string[][],
      callback?: (errors?: Error[]) => void,
    ): Promise<void>
  }

  export function useAsyncStorage(key: string): {
    getItem(
      callback?: (error?: Error, result?: string) => void,
    ): Promise<string | null>
    setItem(value: string, callback?: (error?: Error) => void): Promise<void>
    mergeItem(value: string, callback?: (error?: Error) => void): Promise<void>
    removeItem(callback?: (error?: Error) => void): Promise<void>
  }

  const iCloudStorage: AsyncStorageStatic

  export default iCloudStorage
}

declare module '@robinbobin/react-native-google-drive-api-wrapper' {
  export class MimeTypes {
    static BINARY: string

    static CSV: string

    static FOLDER: string

    static JSON: string

    static PDF: string

    static TEXT: string
  }

  export class GDrive {
    constructor()
    get about(): any
    set about(about: any)
    get accessToken(): string
    set accessToken(accessToken: string)
    get files(): Files
    set files(files: any)
    get permissions(): any
    set permissions(permissions: any)
    __setApi(api: any, apiName: any): void
  }
  export class Files extends GDriveApi {
    constructor()
    copy(fileId: any, queryParameters?: any, requestBody?: {}): any
    createIfNotExists(queryParameters?: any, uploader: any): Promise<{}>
    delete(fileId: any): any
    emptyTrash(): any
    export(fileId: any, queryParameters?: any): any
    generateIds(queryParameters?: any): any
    get(fileId: any, queryParameters?: any, range: any): any
    getBinary(fileId: any, queryParameters?: any, range: any): any
    getContent(fileId: any, queryParameters?: any, range: any): any
    getJson(fileId: any, queryParameters?: any): any
    getMetadata(fileId: any, queryParameters?: {}): any
    getText(fileId: any, queryParameters?: any, range: any): any
    list(queryParameters?: any): any
    get multipartBoundary(): any
    set multipartBoundary(multipartBoundary: any)
    newMediaUploader(): any
    newMetadataOnlyUploader(): any
    newMultipartUploader(): Uploader
    __get(
      fileId: any,
      queryParameters?: any,
      range: any,
      responseType: any,
    ): any
    __getContent(
      fileId: any,
      queryParameters?: any,
      range: any,
      responseType: any,
    ): any
  }
  export default class Uploader {
    constructor(fetcher: any, uploadType: any)
    execute(): any
    setData(data: any, dataType: any): this
    setIdOfFileToUpdate(fileId: any): this
    setIsBase64(isBase64: any): this
    setQueryParameters(queryParameters?: any): this
    setRequestBody(requestBody: any): this
  }
}
