package com.demo.authservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.authservice.mapper.AdminMapper;
import com.demo.common.entity.Admin;
import org.springframework.stereotype.Service;

@Service
public class AdminServiceImpl extends ServiceImpl<AdminMapper, Admin> implements IAdminService {
    @Override
    public Admin findByUsername(String username) {
        return this.getOne(new LambdaQueryWrapper<Admin>()
                .eq(Admin::getUsername, username));
    }
}