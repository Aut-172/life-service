package com.demo.orderservice.handler;

import com.demo.common.dto.Response;
import com.demo.common.exception.BusinessException;
import feign.FeignException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.naming.ServiceUnavailableException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Response<?>> handleBusinessException(BusinessException e) {
        log.warn("业务异常：{}", e.getMessage());
        Response<?> error = Response.error(e.getCode(), e.getMessage());
        // 根据业务码决定 HTTP 状态码，通常业务异常可用 400
        HttpStatus status = HttpStatus.valueOf(e.getCode() >= 400 && e.getCode() < 600 ? e.getCode() : 400);
        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    public ResponseEntity<Response<?>> handleServiceUnavailable(ServiceUnavailableException e) {
        log.error("服务不可用：{}", e.getMessage());
        Response<?> error = Response.error(503, e.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
    }
    // 处理 Feign 异常（网络超时、服务不可达、解码失败等）
    @ExceptionHandler(FeignException.class)
    public ResponseEntity<Response<?>> handleFeignException(FeignException e) {
        log.error("Feign 调用失败，状态码：{}，消息：{}", e.status(), e.getMessage(), e);
        // 根据 Feign 异常的状态码确定返回给客户端的 HTTP 状态码
        int statusCode = e.status() != 0 ? e.status() : 503;  // 若状态码为0（通常表示无响应），默认服务不可用
        String message = "依赖服务调用失败";
        // 尝试从异常中提取响应体（若存在）
        if (e.responseBody().isPresent()) {
            try {
                String body = new String(e.responseBody().get().array(), java.nio.charset.StandardCharsets.UTF_8);
                // 如果响应体是标准 Response 格式，可以进一步解析
                message = "服务返回错误：" + body;
            } catch (Exception ex) {
                // 忽略解析错误
            }
        }
        Response<?> error = Response.error(statusCode, message);
        return ResponseEntity.status(statusCode).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Response<?>> handleException(Exception e) {
        log.error("系统内部错误", e);
        Response<?> error = Response.error(500, "系统内部错误");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}