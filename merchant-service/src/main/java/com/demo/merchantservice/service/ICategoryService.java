package com.demo.merchantservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.Category;
import java.util.List;

public interface ICategoryService extends IService<Category> {
    List<Category> getChildren(Long parentId);
}