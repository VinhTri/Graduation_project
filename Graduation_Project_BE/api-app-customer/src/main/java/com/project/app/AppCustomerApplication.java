package com.project.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ComponentScan(
        basePackages = "com.project.app",
        excludeFilters = {
                @ComponentScan.Filter(
                        type = FilterType.REGEX,
                        pattern = "com\\.project\\.app\\.(WebAdminApplication|AdminApplication|CustomerApplication)"
                )
        }
)
@EnableAsync
@EnableScheduling
public class AppCustomerApplication {
    public static void main(String[] args) {
        SpringApplication.run(AppCustomerApplication.class, args);
    }
}
