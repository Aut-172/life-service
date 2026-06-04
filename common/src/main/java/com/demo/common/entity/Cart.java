package com.demo.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 购物车表（cart）
 */
@Data
@TableName("cart")
public class Cart {
    @TableId(type = IdType.AUTO)
    private Long cartItemId;        // 购物车项ID
    private Long userId;            // 用户ID
    private Long merchantId;        // 商家ID
    private Long productId;         // 商品ID
    private String productName;     // 商品名称
    private BigDecimal productPrice;// 商品价格
    private Integer quantity;       // 数量
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date addTime;           // 添加时间
}