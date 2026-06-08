package com.example.demo.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT 认证拦截器
 * 从请求头中提取 Token 并解析用户信息，存入请求属性
 */
@Component
public class JwtAuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;

    public JwtAuthInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 放行 OPTIONS 请求
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw BusinessException.unauthorized("请先登录");
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            throw BusinessException.unauthorized("登录已过期，请重新登录");
        }

        Long userId = jwtUtil.getUserId(token);
        String role = jwtUtil.getRole(token);

        // 将用户信息存入请求属性
        request.setAttribute("userId", userId);
        request.setAttribute("role", role);

        // 根据角色设置对应的 ID 属性，方便控制器使用
        if ("merchant".equals(role)) {
            request.setAttribute("merchantId", userId);
        } else if ("rider".equals(role)) {
            request.setAttribute("riderId", userId);
        } else if ("admin".equals(role)) {
            request.setAttribute("adminId", userId);
        }

        return true;
    }
}
