# Giai đoạn 1: Build file JAR bằng Gradle Wrapper
FROM gradle:8.7-jdk21-alpine AS builder
WORKDIR /app

# Copy các file cấu hình dependency để cache layer
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY gradlew ./
RUN chmod +x gradlew

# Tải trước dependencies
RUN ./gradlew dependencies --no-daemon || true

# Copy mã nguồn và tiến hành build JAR
COPY src ./src
RUN ./gradlew bootJar -x test --no-daemon

# Giai đoạn 2: Runtime image gọn nhẹ
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy file jar được tạo ra từ build stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Tạo user không đặc quyền để tăng cường bảo mật
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
