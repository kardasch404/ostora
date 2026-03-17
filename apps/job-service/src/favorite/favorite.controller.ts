import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';

@ApiTags('favorites')
@Controller('favorites')
export class FavoriteController {
  constructor(private favoriteService: FavoriteService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle job favorite' })
  async toggle(@Body() dto: ToggleFavoriteDto, @Req() req: any) {
    const userId = req.user.id;
    return this.favoriteService.toggle(userId, dto.jobPostId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user favorites' })
  async list(@Req() req: any) {
    const userId = req.user.id;
    return this.favoriteService.list(userId);
  }
}
