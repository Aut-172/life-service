package com.demo.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

import static com.baomidou.mybatisplus.annotation.IdType.*;

/**
 * 商品表（product）
 */
@Data
@TableName("product")
public class Product {
    @TableId(type = AUTO)
    private Long productId;         // 商品ID
    private Long merchantId;        // 商家ID
    private Long categoryId;        // 分类ID
    private String productName;     // 商品名称
    private String description;     // 商品描述
    private BigDecimal price;       // 商品价格
    private Integer stock;          // 库存
    private Integer productType;    // 商品类型：0外卖/1团购
    private Integer productStatus;  // 商品状态：0在售/1已下架/2售罄
    private String imageUrl;        // 图片URL
    private Integer monthlySales;   // 月销量
}
