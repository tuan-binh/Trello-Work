package org.example.back_end;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class BackEndApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackEndApplication.class, args);
    }

    @Bean
    public CommandLineRunner fixTableColumns(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE labels ALTER COLUMN color TYPE VARCHAR(100)");
                jdbcTemplate.execute("ALTER TABLE labels ALTER COLUMN name TYPE VARCHAR(100)");
                jdbcTemplate.execute("ALTER TABLE boards ALTER COLUMN bg_gradient TYPE VARCHAR(255)");
                jdbcTemplate.execute("ALTER TABLE boards ALTER COLUMN visibility TYPE VARCHAR(50)");
                jdbcTemplate.execute("ALTER TABLE board_members ALTER COLUMN status TYPE VARCHAR(50)");
                jdbcTemplate.execute("ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check");
                jdbcTemplate.execute("ALTER TABLE roles ALTER COLUMN name TYPE VARCHAR(50)");
                jdbcTemplate.execute("ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS fkfxtkd8wg1dw7mv6ocsk63qde1");
                jdbcTemplate.execute("ALTER TABLE activity_logs ADD CONSTRAINT fkfxtkd8wg1dw7mv6ocsk63qde1 FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE");
                System.out.println(">>> SUCCESSFULLY UPDATED DB CONSTRAINTS WITH ON DELETE CASCADE <<<");
            } catch (Exception e) {
                System.out.println(">>> FAILED TO ALTER CONSTRAINTS: " + e.getMessage());
            }
        };
    }
}
