import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Config
import { AIConfigModule } from './config/ai-config.module';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { TrustEngineModule } from './modules/trust-engine/trust-engine.module';
import { MatchingModule } from './modules/matching/matching.module';
import { RiskEngineModule } from './modules/risk-engine/risk-engine.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),

    // Config
    AIConfigModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    TasksModule,
    ReviewsModule,
    TrustEngineModule,
    MatchingModule,
    RiskEngineModule,
    PricingModule,
    ChatbotModule,
  ],
})
export class AppModule {}
