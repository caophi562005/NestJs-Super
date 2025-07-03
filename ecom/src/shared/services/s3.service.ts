import { PutObjectCommand, S3 } from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import envConfig from '../config'
import { Upload } from '@aws-sdk/lib-storage'
import { readFileSync } from 'fs'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import mime from 'mime-types'

@Injectable()
export class S3Service {
  private s3: S3
  constructor() {
    this.s3 = new S3({
      region: envConfig.S3_REGION,
      credentials: {
        secretAccessKey: envConfig.S3_SECRET_KEY,
        accessKeyId: envConfig.S3_ACCESS_KEY,
      },
    })
  }

  uploadFile({ filename, filepath, contentType }: { filename: string; filepath: string; contentType: string }) {
    try {
      const parallelUploads3 = new Upload({
        client: this.s3,
        params: {
          Bucket: envConfig.S3_BUCKET_NAME,
          Key: filename,
          Body: readFileSync(filepath),
          ContentType: contentType,
        },
        tags: [],
        queueSize: 4,
        partSize: 1024 * 1024 * 5,
        leavePartsOnError: false,
      })

      return parallelUploads3.done()
    } catch (e) {
      console.log(e)
    }
  }

  createPresignedUrlWithClient = (filename: string) => {
    const contentType = mime.lookup(filename) || 'application/octet-stream'
    const command = new PutObjectCommand({
      Bucket: envConfig.S3_BUCKET_NAME,
      Key: 'images/' + filename,
      ContentType: contentType,
    })
    return getSignedUrl(this.s3, command, { expiresIn: 3600 })
  }
}
