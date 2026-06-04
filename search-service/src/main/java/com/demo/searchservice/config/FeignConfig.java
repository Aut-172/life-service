package com.demo.orderservice.config;

import com.demo.common.config.CustomErrorDecoder;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfig {
    @Bean
    public ErrorDecoder errorDecoder() {
        // 创建一个新的 ObjectMapper 实例，用于反序列化错误响应（避免影响全局 ObjectMapper）
        ObjectMapper objectMapper = new ObjectMapper();
        // 忽略未知属性
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return new CustomErrorDecoder(objectMapper);
    }
}