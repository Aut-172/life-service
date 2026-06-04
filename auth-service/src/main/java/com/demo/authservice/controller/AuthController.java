//package com.demo.authservice.controller;
//
//import com.demo.authservice.dto.LoginRequest;
//import com.demo.authservice.exception.AuthBusinessException;
//import com.demo.common.dto.RegisterRequest;
//import com.demo.common.exception.BusinessException;
//import com.demo.common.util.JwtUtils;
//import com.demo.common.dto.Response;
//import com.demo.common.entity.User;
//import com.demo.userapi.feign.UserFeignClient;
//import feign.FeignException;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//@RestController
//@RequestMapping("/api/auth")
//public class AuthController {
//    @Autowired
//    UserFeignClient userFeignClient;
//    @Autowired
//    PasswordEncoder passwordEncoder;
//    /**
//     * 用户登录接口
//     * @param loginRequest 手机号和密码
//     * @return 包含 JWT 的响应
//     */
//    @PostMapping("/login")
//    public Response<String> login(@RequestBody LoginRequest loginRequest) {
//        // 1. 根据手机号查询用户
//        User user = null;
//        try {
//            user = userFeignClient.getByPhone(loginRequest.getPhone());
//        } catch (BusinessException e) {
//            throw new AuthBusinessException(e.getCode(),e.getMessage());
//        }catch(FeignException e){
//            throw new AuthBusinessException(500, "服务调用失败");
//        }catch(Exception e){
//            throw new RuntimeException(e.getMessage());
//        }
//
//        // 2. 验证用户是否存在及密码是否正确
//        if (user == null) {
//            return Response.error("手机号或密码错误");
//        }
//
//        // 使用 BCrypt 验证密码（需注入 PasswordEncoder）
//        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
//            return Response.error("手机号或密码错误");
//        }
//
//        // 3. 构建 JWT 负载（仅包含必要信息，避免敏感字段）
//
//        String  token = JwtUtils.createUserJWT(user);
//
//        // 4. 返回 token
//        return Response.success(token);
//
//    }
//    /**
//     * 用户注册接口
//     * @param  registerRequest 注册请求
//     * @return Jwt
//     */
//    @PostMapping("/register")
//    public Response<String> register(@RequestBody RegisterRequest registerRequest) {
//        try {
//            // 调用 Service 执行注册
//            User user = userFeignClient.register(registerRequest);
//            String token = JwtUtils.createUserJWT(user);
//            return Response.success("注册成功",token);
//        } catch (BusinessException e) {
//            // 业务逻辑异常（如手机号已存在）
//           throw new AuthBusinessException(e.getCode(),e.getMessage());
//        } catch (FeignException e) {
//            // 其他系统异常
//            throw new AuthBusinessException(503,"服务间调用失败");
//        }catch(Exception e){
//            throw new RuntimeException(e.getMessage());
//        }
//    }
//
//}
package com.demo.authservice.controller;

import com.demo.common.dto.Response;
import com.demo.common.entity.*;
import com.demo.authservice.service.IAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private IAdminService adminService;

    // 用户注册（简化，实际应调用user-service）
    @PostMapping("/user/register")
    public Response<Long> registerUser(@RequestBody User user) {
        // 实际应通过Feign调用user-service保存用户，此处仅为示例
        return Response.success(1L);
    }

    // 用户登录
    @PostMapping("/user/login")
    public Response<Map<String, Object>> loginUser(@RequestParam String username, @RequestParam String password) {
        // 验证逻辑省略，返回token
        Map<String, Object> data = new HashMap<>();
        data.put("token", "mock-jwt-token");
        data.put("userId", 1L);
        return Response.success(data);
    }

    // 商家登录
    @PostMapping("/merchant/login")
    public Response<Map<String, Object>> loginMerchant(@RequestParam String username, @RequestParam String password) {
        Map<String, Object> data = new HashMap<>();
        data.put("token", "mock-merchant-token");
        data.put("merchantId", 1L);
        return Response.success(data);
    }

    // 骑手注册（商家后台添加骑手时调用，此处简化）
    @PostMapping("/rider/register")
    public Response<Long> registerRider(@RequestBody Rider rider) {
        return Response.success(1L);
    }

    // 骑手登录
    @PostMapping("/rider/login")
    public Response<Map<String, Object>> loginRider(@RequestParam String phone, @RequestParam String password) {
        Map<String, Object> data = new HashMap<>();
        data.put("token", "mock-rider-token");
        data.put("riderId", 1L);
        return Response.success(data);
    }

    // 管理员登录
    @PostMapping("/admin/login")
    public Response<Map<String, Object>> loginAdmin(@RequestParam String username, @RequestParam String password) {
        Admin admin = adminService.findByUsername(username);
        // 验证密码省略
        Map<String, Object> data = new HashMap<>();
        data.put("token", "mock-admin-token");
        data.put("adminId", admin.getAdminId());
        return Response.success(data);
    }
}