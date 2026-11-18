FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw
RUN --mount=type=cache,target=/root/.m2 ./mvnw dependency:go-offline
COPY src src
RUN --mount=type=cache,target=/root/.m2 ./mvnw -DskipTests package && cp target/*.jar app.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r app
USER app
COPY --from=build /app/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
