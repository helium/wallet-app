/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
