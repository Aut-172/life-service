package com.demo.productservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.Product;
import com.demo.productservice.mapper.ProductMapper;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProductServiceImpl extends ServiceImpl<ProductMapper, Product> implements IProductService {
    @Override
    public List<Product> getProductsByMerchantId(Long merchantId) {
        return this.list(new LambdaQueryWrapper<Product>().eq(Product::getMerchantId, merchantId));
    }

    @Override
    public boolean updateStatus(Long productId, Integer status) {
        Product product = this.getById(productId);
        if (product != null) {
            product.setProductStatus(status);
            return this.updateById(product);
        }
        return false;
    }
}