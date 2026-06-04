//package com.demo.userservice.controller;
//
//import com.alibaba.csp.sentinel.annotation.SentinelResource;
//import com.alibaba.csp.sentinel.slots.block.BlockException;
//import com.demo.common.entity.User;
//import com.demo.common.dto.RegisterRequest;
//import com.demo.common.exception.BusinessException;
//import com.demo.userservice.service.IUserService;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/api/internal/users")
//@Slf4j
//public class UserInternalController {
//
//    @Autowired
//    private IUserService userService;
//
//    @GetMapping("/phone")
//    @SentinelResource(value = "getByPhone",
//            blockHandler = "handleBlock",      // 限流/熔断时的处理
//            fallback = "handleFallback")
//    public User getByPhone(String phone) {
//        return userService.getByPhone(phone);
//    }
//    public User handleBlock(Long id, BlockException ex) {
//        log.warn("接口 getParkingLot 被限流或熔断：{}", ex.getClass().getSimpleName());
//        throw new BusinessException(500,"系统繁忙，请稍后再试");
//    }
//
//    // 业务异常降级方法（可选）
//    public User handleFallback(Long id, Throwable ex) {
//        log.error("业务异常：{}", ex.getMessage());
//        throw new BusinessException(500,"服务内部错误");
//    }
//
//    @PostMapping("/register")
//    public User register(@RequestBody RegisterRequest registerRequest) {
//        return userService.register(registerRequest);
//    }
//}