package com.demo.merchantservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.Category;
import com.demo.merchantservice.mapper.CategoryMapper;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryServiceImpl extends ServiceImpl<CategoryMapper, Category> implements ICategoryService {
    @Override
    public List<Category> getChildren(Long parentId) {
        return this.list(new LambdaQueryWrapper<Category>().eq(Category::getParentId, parentId));
    }
}