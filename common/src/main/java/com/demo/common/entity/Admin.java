package com.demo.common.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 管理员表（admin）
 */
@Data
@TableName("admin")
public class Admin {
    @TableId(type = IdType.AUTO)
    private Long adminId;           // 管理员ID
    private String username;        // 用户名
    private String password;        // 密码（密文）
}