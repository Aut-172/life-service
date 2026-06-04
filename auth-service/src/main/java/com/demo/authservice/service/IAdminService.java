package com.demo.authservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.Admin;

public interface IAdminService extends IService<Admin> {
    Admin findByUsername(String username);
}