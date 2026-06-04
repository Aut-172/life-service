package com.demo.common.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 收货地址表（address）
 */
@Data
@TableName("address")
public class Address {
    @TableId(type = IdType.AUTO)
    private Long addressId;         // 地址ID
    private Long userId;            // 用户ID
    private String receiverName;    // 收货人姓名
    private String phone;           // 手机号
    private String detailAddress;   // 详细地址
    private Double longitude;       // 经度
    private Double latitude;        // 纬度
    private Boolean isDefault;      // 是否默认地址
}