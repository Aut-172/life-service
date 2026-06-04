package com.demo.common.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 订单明细表（order_item）
 */
@Data
@TableName("order_item")
public class OrderItem {
    @TableId(type = IdType.AUTO)
    private Long itemId;            // 明细ID
    private Long orderId;           // 订单ID
    private Long productId;         // 商品ID
    private String productNameSnapshot;   // 商品名称快照
    private BigDecimal productPriceSnapshot; // 商品价格快照
    private Integer quantity;       // 数量
    private BigDecimal subtotal;    // 小计金额
}