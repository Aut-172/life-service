package com.demo.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.util.Date;

/**
 * 用户表（user）
 */
@Data
@TableName("user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long userId;            // 用户ID
    private String username;        // 用户名
    private String password;        // 密码（密文）
    private String phone;           // 手机号
    private Integer role;           // 角色
    private Integer accountStatus;  // 账号状态
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;        // 创建时间
}

