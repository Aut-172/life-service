package com.demo.productservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.Product;
import java.util.List;

public interface IProductService extends IService<Product> {
    List<Product> getProductsByMerchantId(Long merchantId);
    boolean updateStatus(Long productId, Integer status);
}