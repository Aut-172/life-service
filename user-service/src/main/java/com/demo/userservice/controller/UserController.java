package com.demo.userservice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.demo.common.dto.Response;
import com.demo.common.entity.Address;
import com.demo.common.entity.User;
import com.demo.userservice.service.IAddressService;
import com.demo.userservice.service.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private IUserService userService;
    @Autowired
    private IAddressService addressService;

    // ---------- 个人中心 ----------
    @GetMapping("/profile")
    public Response<User> getProfile() {
        Long userId = getCurrentUserId();
        User user = userService.getById(userId);
        return Response.success(user);
    }

    @PutMapping("/profile")
    public Response<Boolean> updateProfile(@RequestBody User user) {
        Long userId = getCurrentUserId();
        user.setUserId(userId);
        return Response.success(userService.updateById(user));
    }

    // ---------- 收货地址管理 ----------
    @GetMapping("/addresses")
    public Response<List<Address>> getAddresses() {
        Long userId = getCurrentUserId();
        return Response.success(addressService.getAddressesByUserId(userId));
    }

    @PostMapping("/address")
    public Response<Boolean> addAddress(@RequestBody Address address) {
        Long userId = getCurrentUserId();
        address.setUserId(userId);
        return Response.success(addressService.save(address));
    }

    @PutMapping("/address")
    public Response<Boolean> updateAddress(@RequestBody Address address) {
        Long userId = getCurrentUserId();
        address.setUserId(userId);
        return Response.success(addressService.updateById(address));
    }

    @DeleteMapping("/address/{addressId}")
    public Response<Boolean> deleteAddress(@PathVariable Long addressId) {
        return Response.success(addressService.removeById(addressId));
    }

    @PutMapping("/address/default/{addressId}")
    public Response<Boolean> setDefaultAddress(@PathVariable Long addressId) {
        Long userId = getCurrentUserId();
        addressService.setDefaultAddress(userId, addressId);
        return Response.success(true);
    }

    // ---------- 管理员：用户管理 ----------
    @GetMapping("/admin/users")
    public Response<List<User>> listUsers(@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int size) {
        // 分页查询省略，直接返回全部（演示）
        return Response.success(userService.list());
    }

    @PutMapping("/admin/user/status")
    public Response<Boolean> updateUserStatus(@RequestParam Long userId, @RequestParam Integer status) {
        User user = userService.getById(userId);
        user.setAccountStatus(status);
        return Response.success(userService.updateById(user));
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }
}