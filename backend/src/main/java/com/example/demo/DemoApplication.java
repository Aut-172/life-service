package com.example.demo;

import com.example.demo.auth.entity.Admin;
import com.example.demo.auth.mapper.AdminMapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication(exclude = {
    RedisAutoConfiguration.class,
    RedisRepositoriesAutoConfiguration.class
})
@MapperScan("com.example.demo.**.mapper")
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @Bean
    public CommandLineRunner initAdminAccount(AdminMapper adminMapper) {
        return args -> {
            // 检查 gl1 管理员账号是否已存在
            Admin existing = adminMapper.selectById(2L);
            if (existing == null) {
                Admin gl1 = new Admin();
                gl1.setId(2L);
                gl1.setUsername("gl1");
                gl1.setPassword(new BCryptPasswordEncoder().encode("gl1gl1gl1"));
                adminMapper.insert(gl1);
                System.out.println("管理员账号 gl1 已创建（密码: gl1gl1gl1）");
            }
        };
    }
}
