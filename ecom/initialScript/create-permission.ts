import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { HTTPMethod, RoleName } from 'src/shared/constants/role.constant'
import { PrismaService } from 'src/shared/services/prisma.service'

const prisma = new PrismaService()

const SellerModule = ['AUTH', 'MEDIA', 'MANAGE-PRODUCT', 'PRODUCT-TRANSLATIONS', 'PROFILE', 'CART', 'ORDERS', 'REVIEWS']
const ClientModule = ['AUTH', 'MEDIA', 'PROFILE', 'CART', 'ORDERS', 'REVIEWS']

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3001)
  const server = app.getHttpAdapter().getInstance()
  const router = server.router
  const permissionInDb = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })

  const availableRoutes: { path: string; method: keyof typeof HTTPMethod; module: string; name: string }[] =
    router.stack
      .map((layer) => {
        if (layer.route) {
          const path = layer.route?.path
          const method = String(layer.route?.stack[0].method).toUpperCase() as keyof typeof HTTPMethod
          const moduleName = String(path.split('/')[1]).toUpperCase()
          return {
            path,
            method,
            name: method + ' ' + path,
            module: moduleName,
          }
        }
      })
      .filter((item) => item !== undefined)

  //Tạo object PermissionInDbMap với key là [method-path]
  const permissionInDbMap = permissionInDb.reduce((acc, item) => {
    acc[`${item.method}-${item.path}`] = item
    return acc
  }, {})
  //Tạo object availableRoutesMap với key là [method-path]
  const availableRoutesMap = availableRoutes.reduce((acc, item) => {
    acc[`${item.method}-${item.path}`] = item
    return acc
  }, {})

  //Tìm permission trong db mà k tồn tại trong available
  const permissionToDelete = permissionInDb.filter((item) => {
    return !availableRoutesMap[`${item.method}-${item.path}`]
  })

  //Xoá permission không tồn tại trong availableRoutes
  if (permissionToDelete.length > 0) {
    const deleteResult = await prisma.permission.deleteMany({
      where: {
        id: {
          in: permissionToDelete.map((item) => item.id),
        },
      },
    })
    console.log('Delete : ', deleteResult.count)
  } else {
    console.log('No permission to delete')
  }

  //Tìm route không tồn tại trong permissionInDb
  const routesToAdd = availableRoutes.filter((item) => {
    return !permissionInDbMap[`${item.method}-${item.path}`]
  })

  //Thêm các route
  if (routesToAdd.length > 0) {
    const permissionToAdd = await prisma.permission.createMany({
      data: routesToAdd,
      skipDuplicates: true,
    })
    console.log('Add : ', permissionToAdd.count)
  } else {
    console.log('No permission to add')
  }

  // Lấy lại permission trong DB sau khi chỉnh sửa
  const updatedPermissionInDb = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })

  const adminPermissionIds = updatedPermissionInDb.map((item) => ({ id: item.id }))

  const sellerPermissionIds = updatedPermissionInDb
    .filter((item) => SellerModule.includes(item.module))
    .map((item) => ({ id: item.id }))

  const clientPermissionIds = updatedPermissionInDb
    .filter((item) => ClientModule.includes(item.module))
    .map((item) => ({ id: item.id }))

  await Promise.all([
    updateRole(adminPermissionIds, RoleName.Admin),
    updateRole(sellerPermissionIds, RoleName.Seller),
    updateRole(clientPermissionIds, RoleName.Client),
  ])

  //Thoát ra
  process.exit(0)
}

const updateRole = async (permissionIds: { id: number }[], roleName: string) => {
  const role = await prisma.role.findFirstOrThrow({
    where: {
      name: roleName,
      deletedAt: null,
    },
  })
  await prisma.role.update({
    where: {
      id: role.id,
    },
    data: {
      permissions: {
        set: permissionIds,
      },
    },
  })
}
bootstrap()
