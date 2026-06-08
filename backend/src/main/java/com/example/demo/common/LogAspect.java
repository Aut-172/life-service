package com.example.demo.common;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 统一日志切面
 * 记录所有 Controller 的请求参数、响应结果和执行时间
 */
@Slf4j
@Aspect
@Component
public class LogAspect {

    /** 请求体或响应体中需要脱敏的字段名集合 */
    private static final List<String> SENSITIVE_KEYS = List.of("password", "secret", "token", "authorization");

    @Pointcut("execution(public * com.example.demo..controller.*.*(..))")
    public void controllerPointcut() {
    }

    @Around("controllerPointcut()")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();

        // 获取请求信息
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = (attributes != null) ? attributes.getRequest() : null;

        // 构建请求日志
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String httpMethod = (request != null) ? request.getMethod() : "-";
        String requestUri = (request != null) ? request.getRequestURI() : "-";
        String queryString = (request != null) ? StrUtil.nullToEmpty(request.getQueryString()) : "";
        String args = maskSensitiveArgs(joinPoint.getArgs());

        log.info("→ [{}{}] {}.{} | args={}{}",
                httpMethod, requestUri, className, methodName, args,
                StrUtil.isNotBlank(queryString) ? " ?" + queryString : "");

        // 执行目标方法
        Object result = joinPoint.proceed();

        long elapsed = System.currentTimeMillis() - startTime;
        String resultStr = maskSensitiveResult(result);

        log.info("← [{}{}] {}.{} | cost={}ms | result={}",
                httpMethod, requestUri, className, methodName, elapsed, resultStr);

        return result;
    }

    /**
     * 对参数中的敏感字段进行脱敏
     */
    private String maskSensitiveArgs(Object[] args) {
        if (args == null || args.length == 0) {
            return "";
        }
        return Arrays.stream(args)
                .map(arg -> {
                    if (arg == null) return "null";
                    String json;
                    try {
                        json = JSONUtil.toJsonStr(arg);
                    } catch (Exception e) {
                        json = arg.toString();
                    }
                    return maskSensitiveJson(json);
                })
                .collect(Collectors.joining(", ", "[", "]"));
    }

    /**
     * 对响应结果中的敏感字段进行脱敏
     */
    private String maskSensitiveResult(Object result) {
        if (result == null) return "null";
        try {
            String json = JSONUtil.toJsonStr(result);
            return StrUtil.maxLength(maskSensitiveJson(json), 2000);
        } catch (Exception e) {
            String str = result.toString();
            return StrUtil.maxLength(str, 2000);
        }
    }

    /**
     * 将 JSON 字符串中的敏感字段值替换为 ****
     */
    private String maskSensitiveJson(String json) {
        if (StrUtil.isBlank(json)) return json;
        String masked = json;
        for (String key : SENSITIVE_KEYS) {
            // 匹配 "key":"value" 或 "key":"value" 格式
            masked = masked.replaceAll(
                    "(?i)\"" + key + "\"\\s*:\\s*\"([^\"]+)\"",
                    "\"" + key + "\":\"****\""
            );
        }
        return masked;
    }
}
