import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request, 
  Get, 
  Patch, 
  Delete, 
  Param, 
  Query,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/jwt.strategy';
import { UploadService } from '../upload/upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';


@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private uploadService: UploadService
  ) {}

  @Post('create')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Post('login')
  login(@Body() dto: LoginUserDto) {
    return this.usersService.login(dto.email, dto.password);
  }

   @Post('resetpassword')
  resetPasswordRequest(@Body('email') email: string) {
    return this.usersService.resetUserPasswordRequest({email});
  }

  @Post('resetpassword/:token')
  resetPassword(@Param('token') token: string, @Body('password') password: string) {
    return this.usersService.ResetPassword({token, password});
  }


  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Request() req: RequestWithUser) {
    const token = (req as any).headers.authorization?.split(' ')[1];
    return this.usersService.logout(req.user.userId, token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout/all')
  logoutAll(@Request() req: RequestWithUser) {
    return this.usersService.logoutAll(req.user.userId);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('all')
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('exists')
  async exists(@Query('email') email: string) {
    if (!email) {
      return { exists: false };
    }
    const userId = await this.usersService.findIdByEmail(email);
    return { exists: !!userId, userId };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: RequestWithUser) {
    return this.usersService.findOne(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update/:id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(+id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }


  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), 
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
      },
      fileFilter(req, file, callback) {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if(allowed.includes(file.mimetype)){
          callback(null, true);
        }
        else {
          callback(new Error('Seules les images sont autoriser'), false);
        }
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestWithUser
  ){
    const url = await this.uploadService.uploadFile(file, 'avatar');
    await this.usersService.updateAvatar(req.user.userId, url);
    return { avatarUrl: url}
  }
}
