package com.demo.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 分类表（category）
 */
@Data
@TableName("category")
public class Category {
    @TableId(type = IdType.AUTO)
    private Long categoryId;        // 分类ID
    private String categoryName;    // 分类名称
    private Long parentId;          // 父分类ID
}