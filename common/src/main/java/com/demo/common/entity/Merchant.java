package com.demo.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 商家表（merchant）
 */
@Data
@TableName("merchant")
public class Merchant {
    @TableId(type = IdType.AUTO)
    private Long merchantId;        // 商家ID
    private String username;        // 用户名
    private String password;        // 密码（密文）
    private String merchantName;    // 商家名称
    private String contactPhone;    // 联系电话
    private String address;         // 营业地址
    private Double longitude;       // 经度
    private Double latitude;        // 纬度
    private String businessHours;   // 营业时间
    private String merchantType;    // 商家类型
    private String description;     // 店铺简介
    private Integer merchantStatus; // 商家状态：0待审核/1营业中/2休息中/3已冻结
    private BigDecimal avgScore;    // 综合评分
    private Integer monthlySales;   // 月销量
    private BigDecimal minPrice;    // 起送价
    private Integer deliveryRadius; // 配送半径（米）
}
