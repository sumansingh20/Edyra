services:
  # MongoDB
  mongodb:
    image: mongo:7.0
    container_name: proctorexam-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: proctorexam_secret
      MONGO_INITDB_DATABASE: proctorexam
    volumes:
      - mongodb_data:/data/db
      - ./docker/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - proctorexam-network

  # Redis
  redis:
    image: redis:7-alpine
    container_name: proctorexam-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass proctorexam_redis
    volumes:
      - redis_data:/data
    networks:
      - proctorexam-network

  # Backend
  backend:
    build:
      context: ./backend
    container_name: proctorexam-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb+srv://sumankumar:sumankumar@cluster0.jifjpli.mongodb.net/
      REDIS_URL: redis://:proctorexam_redis@redis:6379
      JWT_SECRET: your_super_secret_jwt_key
      JWT_REFRESH_SECRET: your_super_secret_refresh_key
      FRONTEND_URL: http://localhost:3000
      CORS_ORIGIN: http://localhost:3000
    depends_on:
      - mongodb
      - redis
    networks:
      - proctorexam-network

  # Frontend
  frontend:
    build:
      context: ./frontend
    container_name: proctorexam-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000/api
      NEXT_PUBLIC_SOCKET_URL: http://localhost:5000
    networks:
      - proctorexam-network

volumes:
  mongodb_data:
  redis_data:

networks:
  proctorexam-network: