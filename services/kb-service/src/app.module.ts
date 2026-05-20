import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArticlesModule } from './articles/articles.module';
import { CategoriesModule } from './categories/categories.module';
import { VersionsModule } from './versions/versions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ArticlesModule,
    CategoriesModule,
    VersionsModule,
  ],
})
export class AppModule {}
