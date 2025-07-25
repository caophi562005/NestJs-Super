import { ParseFileOptions, ParseFilePipe } from '@nestjs/common'
import { unlink } from 'fs/promises'

export class ParseFilePipeWithUnlink extends ParseFilePipe {
  constructor(options?: ParseFileOptions) {
    super(options)
  }

  async transform(files: Array<Express.Multer.File>): Promise<any> {
    // console.log(
    //   'Uploaded files:',
    //   files.map((file) => ({
    //     originalname: file.originalname,
    //     mimetype: file.mimetype,
    //   })),
    // )
    return super.transform(files).catch(async (error) => {
      await Promise.all(files.map((file) => unlink(file.path)))
      throw error
    })
  }
}
