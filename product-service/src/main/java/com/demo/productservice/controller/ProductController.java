package com.demo.productservice.controller;

import com.demo.common.dto.Response;
import com.demo.common.entity.Product;
import com.demo.productservice.service.IProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/product")
public class ProductController {

    @Autowired
    private IProductService productService;

    // ---------- 商家管理 ----------
    @GetMapping("/merchant/products")
    public Response<List<Product>> getMerchantProducts() {
        Long merchantId = getCurrentMerchantId();
        return Response.success(productService.getProductsByMerchantId(merchantId));
    }

    @PostMapping("/merchant/product")
    public Response<Boolean> addProduct(@RequestBody Product product) {
        product.setMerchantId(getCurrentMerchantId());
        return Response.success(productService.save(product));
    }

    @PutMapping("/merchant/product")
    public Response<Boolean> updateProduct(@RequestBody Product product) {
        product.setMerchantId(getCurrentMerchantId());
        return Response.success(productService.updateById(product));
    }

    @PutMapping("/merchant/product/status")
    public Response<Boolean> updateProductStatus(@RequestParam Long productId, @RequestParam Integer status) {
        return Response.success(productService.updateStatus(productId, status));
    }

    // ---------- 用户浏览 ----------
    @GetMapping("/merchant/{merchantId}/products")
    public Response<List<Product>> getProductsByMerchant(@PathVariable Long merchantId) {
        return Response.success(productService.getProductsByMerchantId(merchantId));
    }

    @GetMapping("/detail/{productId}")
    public Response<Product> getProductDetail(@PathVariable Long productId) {
        return Response.success(productService.getById(productId));
    }

    private Long getCurrentMerchantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }
}