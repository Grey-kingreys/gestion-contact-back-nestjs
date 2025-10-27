import { Controller, Post, Body, UseGuards, Request, Get, Patch, Delete, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

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
  logout(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.usersService.logout(req.user.sub, token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout/all')
  logoutAll(@Request() req) {
    return this.usersService.logoutAll(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req) {
    return this.usersService.findOne(req.user.sub);
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
}
