import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import path from 'path'
import { UPLOAD_DIR } from 'src/shared/constants/other.constant'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { MediaService } from './media.service'
import { ParseFilePipeWithUnlink } from './parse-file-pipe-with-unlink.pipe'
import { ZodSerializerDto } from 'nestjs-zod'
import { PresignedUploadFileBodyDTO, PresignedUploadFileResDTO, UploadFileResDTO } from './media.dto'

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('images/upload')
  @ZodSerializerDto(UploadFileResDTO)
  @UseInterceptors(FilesInterceptor('files', 100))
  async uploadFile(
    @UploadedFiles(
      new ParseFilePipeWithUnlink({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // Giới hạn kích thước 5MB
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|gif)$/i, // Hỗ trợ JPEG, PNG, GIF
          }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    return this.mediaService.uploadFile(files)
    // return files.map((file) => ({
    //   url: `${envConfig.PREFIX_STATIC_ENDPOINT}/${file.filename}`,
    // }))
  }

  @Get('static/:filename')
  @IsPublic()
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(path.resolve(UPLOAD_DIR, filename), (error) => {
      if (error) {
        const notFound = new NotFoundException('File not found')
        res.status(notFound.getStatus()).send(notFound.getResponse())
      }
    })
  }

  @Post('images/upload/presigned-url')
  @ZodSerializerDto(PresignedUploadFileResDTO)
  @IsPublic()
  async createPresignedUrl(@Body() body: PresignedUploadFileBodyDTO) {
    return this.mediaService.getPresignUrl(body)
  }
}
