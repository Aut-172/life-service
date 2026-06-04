package com.demo.userservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.User;

public interface IUserService extends IService<User> {
    User findByUsername(String username);
    User findByPhone(String phone);
}