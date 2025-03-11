import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { DeepPartial } from 'typeorm';
import { SigninAdminDto, CreateAdminDto, UpdateAdminDto } from './dto';
import { CreateStoreDto } from '../store/dto';
import {
  CustomJwtService,
  BaseService,
  BcryptEncryption,
} from '../../infrastructure';
import { AdminEntity, AdminRepository } from '../../core';
import { StoreService } from '../store/store.service';
import { PayStoreDto } from './dto/payStore-admin.dto';
@Injectable()
export class AdminService extends BaseService<
  CreateAdminDto,
  DeepPartial<AdminEntity>
> {
  constructor(
    @InjectRepository(AdminEntity) repository: AdminRepository,
    private readonly storeService: StoreService,
    private jwt: CustomJwtService,
    private readonly configService: ConfigService,
  ) {
    super(repository);
  }
  async createAdmin(createAdminDto: CreateAdminDto) {
    const { username, password, phone_number } = createAdminDto;
    const exist_username = await this.getRepository.findOne({
      where: { username },
    });
    if (exist_username) {
      throw new ConflictException(`Username already exist`);
    }
    if (phone_number) {
      const exist_phone = await this.getRepository.findOne({
        where: { phone_number },
      });
      if (exist_phone) {
        throw new ConflictException(`Phone number already exist`);
      }
    }
    const hashed_password = await BcryptEncryption.encrypt(password);
    try {
      const Admin = await this.getRepository.create({
        ...createAdminDto,
        hashed_password,
      });
      await this.getRepository.save(Admin);
    } catch (error) {
      throw new BadRequestException(`Error on creating super admin: ${error}`);
    }
    return { status_code: HttpStatus.CREATED, message: 'success' };
  }

  async createStore(createStoreDto: CreateStoreDto) {
    return this.storeService.storeCreate(createStoreDto);
  }

  async payToSotore(payStoreDto: PayStoreDto) {
    const store = await this.storeService.findOneById(payStoreDto.store_id);
    const sum = +store.data.wallet + payStoreDto.sum;
    await this.storeService.getRepository.update(store.data.id, {
      wallet: sum,
    });
    return { status_code: HttpStatus.OK, message: 'success' };
  }

  async signin(signinDto: SigninAdminDto, res: Response) {
    const { username, password } = signinDto;
    const admin = await this.getRepository.findOne({ where: { username } });
    if (!admin) {
      throw new BadRequestException('Username or password invalid');
    }
    const is_match_pass = await BcryptEncryption.compare(
      password,
      admin.hashed_password,
    );
    if (!is_match_pass) {
      throw new BadRequestException('Username or password invalid');
    }
    const payload = { sub: admin.username, id: admin.id, role: admin.role };
    const accessToken = await this.jwt.generateAccessToken(payload);
    const refreshToken = await this.jwt.generateRefreshToken(payload);
    this.writeToCookie(refreshToken, res);
    return {
      status_code: HttpStatus.OK,
      message: 'success',
      data: {
        accessToken,
        access_token_expire:
          this.configService.get<string>('ACCESS_TOKEN_TIME'),
        refreshToken,
        refresh_token_expire:
          this.configService.get<string>('REFRESH_TOKEN_TIME'),
      },
    };
  }

  async refresh_token(refresh_token: string) {
    const data = await this.jwt.verifyRefreshToken(refresh_token);
    const admin = await this.findOneById(data?.id);
    const payload = {
      sub: admin.data.username,
      id: admin.data.id,
      role: admin.data.role,
    };
    const accessToken = await this.jwt.generateAccessToken(payload);
    return {
      status_code: HttpStatus.OK,
      message: 'success',
      data: {
        token: accessToken,
        expire: this.configService.get<string>('ACCESS_TOKEN_TIME'),
      },
    };
  }

  async logout(refresh_token: string, res: Response) {
    const data = await this.jwt.verifyRefreshToken(refresh_token);
    await this.findOneById(data?.id);
    res.clearCookie('refresh_token_store');
    return {
      status_code: HttpStatus.OK,
      message: 'success',
    };
  }
  async getAllAdmin() {
    return this.findAll();
  }

  async getAdminById(id: string) {
    try {
      const Admin = await this.getRepository.findOne({ where: { id } });
      if (!Admin) {
        throw new NotFoundException(`Admin with id ${id} not found.`);
      }
      return {
        status_code: 200,
        message: 'success',
        data: { Admin },
      };
    } catch (error) {
      throw new BadRequestException(`Error on delete  of admin: ${error}`);
    }
  }
  async editProfile(id: string, updateAdminDto: UpdateAdminDto) {
    let { username, phone_number, password, role } = updateAdminDto;
    const admin = await this.getRepository.findOne({
      where: { id },
    });
    if (!admin) {
      throw new NotFoundException(`Admin with id ${id} not found.`);
    }
    if (password) {
      password = await BcryptEncryption.encrypt(password);
    } else {
      password = admin.hashed_password;
    }
    if (!username) {
      username = admin.username;
    }

    if (!phone_number) {
      phone_number = admin.phone_number;
    }
    try {
      await this.getRepository.update(id, {
        username,
        hashed_password: password,
        phone_number,
        updated_at: Date.now(),
      });
    } catch (error) {
      throw new BadRequestException(
        `Error on update profile of admin: ${error}`,
      );
    }
    return {
      status_code: 200,
      message: 'success',
    };
  }
  async deleteAdmin(id: string) {
    try {
      await this.findOneById(id);
      await this.delete(id);
    } catch (error) {
      throw new BadRequestException(`Error on delete  of admin: ${error}`);
    }
    return {
      status_code: 200,
      message: 'success',
    };
  }

  private async writeToCookie(refresh_token: string, res: Response) {
    try {
      res.cookie('refresh_token_admin', refresh_token, {
        maxAge: 15 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
    } catch (error) {
      throw new BadRequestException(`Error on write to cookie: ${error}`);
    }
  }
}
