package com.example.demo.merchant.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.auth.entity.Merchant;
import com.example.demo.common.PageResult;
import com.example.demo.common.Result;
import com.example.demo.merchant.dto.MerchantListDTO;
import com.example.demo.merchant.dto.MerchantProfileDTO;
import com.example.demo.merchant.dto.ProductDTO;
import com.example.demo.merchant.entity.Category;
import com.example.demo.merchant.entity.Product;
import com.example.demo.merchant.entity.ProductSpec;
import com.example.demo.merchant.entity.SpecGroup;
import com.example.demo.merchant.service.MerchantService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 商家服务控制器
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MerchantController {

    private final MerchantService merchantService;

    // ==================== 公开接口（无需登录） ====================

    /**
     * 获取商家列表
     */
    @GetMapping("/merchants")
    public Result<PageResult<MerchantListDTO>> getMerchantList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        Page<MerchantListDTO> pageResult = merchantService.getMerchantListWithProducts(keyword, category, page, size);
        return Result.success(PageResult.of(pageResult));
    }

    /**
     * 获取商家详情
     */
    @GetMapping("/merchants/{id}")
    public Result<MerchantProfileDTO> getMerchantDetail(@PathVariable Long id) {
        MerchantProfileDTO detail = merchantService.getMerchantDetail(id);
        return Result.success(detail);
    }

    /**
     * 获取商品详情
     */
    @GetMapping("/products/{id}")
    public Result<ProductDTO> getProductDetail(@PathVariable Long id) {
        ProductDTO detail = merchantService.getProductDetail(id);
        return Result.success(detail);
    }

    /**
     * 获取所有商品分类
     */
    @GetMapping("/categories")
    public Result<List<Category>> getAllCategories() {
        List<Category> categories = merchantService.getAllCategories();
        return Result.success(categories);
    }

    // ==================== 商家端接口（需商家登录） ====================

    /**
     * 获取商家自己的信息
     */
    @GetMapping("/merchant/profile")
    public Result<Merchant> getMyProfile(HttpServletRequest request) {
        Long merchantId = (Long) request.getAttribute("merchantId");
        if (merchantId == null) {
            return Result.unauthorized("请先登录商家账号");
        }
        Merchant merchant = merchantService.getMerchantBasicInfo(merchantId);
        return Result.success(merchant);
    }

    /**
     * 更新商家信息
     */
    @PutMapping("/merchant/profile")
    public Result<Merchant> updateProfile(HttpServletRequest request, @RequestBody Merchant merchant) {
        Long merchantId = (Long) request.getAttribute("merchantId");
        if (merchantId == null) {
            return Result.unauthorized("请先登录商家账号");
        }
        return Result.success(merchantService.updateMerchantProfile(merchantId, merchant));
    }

    /**
     * 获取商家自己的商品列表
     */
    @GetMapping("/merchant/products")
    public Result<List<Product>> getMyProducts(HttpServletRequest request) {
        Long merchantId = (Long) request.getAttribute("merchantId");
        if (merchantId == null) {
            return Result.unauthorized("请先登录商家账号");
        }
        List<Product> products = merchantService.getMerchantProducts(merchantId);
        return Result.success(products);
    }

    /**
     * 添加商品
     */
    @PostMapping("/merchant/products")
    public Result<Product> addProduct(HttpServletRequest request, @RequestBody Product product) {
        Long merchantId = (Long) request.getAttribute("merchantId");
        if (merchantId == null) {
            return Result.unauthorized("请先登录商家账号");
        }
        return Result.success(merchantService.addProduct(merchantId, product));
    }

    /**
     * 更新商品
     */
    @PutMapping("/merchant/products")
    public Result<Product> updateProduct(HttpServletRequest request, @RequestBody Product product) {
        Long merchantId = (Long) request.getAttribute("merchantId");
        if (merchantId == null) {
            return Result.unauthorized("请先登录商家账号");
        }
        return Result.success(merchantService.updateProduct(merchantId, product));
    }

    /**
     * 删除商品
     */
    @DeleteMapping("/merchant/products/{productId}")
    public Result<Void> deleteProduct(HttpServletRequest request, @PathVariable Long productId) {
        Long merchantId = (Long) request.getAttribute("merchantId");
        if (merchantId == null) {
            return Result.unauthorized("请先登录商家账号");
        }
        merchantService.deleteProduct(merchantId, productId);
        return Result.success();
    }

    /**
     * 添加规格分组
     */
    @PostMapping("/merchant/spec-groups")
    public Result<Void> addSpecGroup(HttpServletRequest request, @RequestBody SpecGroup specGroup) {
        Long merchantId = (Long) request.getAttribute("merchantId");
        if (merchantId == null) {
            return Result.unauthorized("请先登录商家账号");
        }
        merchantService.addSpecGroup(merchantId, specGroup);
        return Result.success();
    }

    /**
     * 删除规格分组
     */
    @DeleteMapping("/merchant/spec-groups/{groupId}")
    public Result<Void> deleteSpecGroup(HttpServletRequest request, @PathVariable Long groupId) {
        Long merchantId = (Long) request.getAttribute("merchantId");
        if (merchantId == null) {
            return Result.unauthorized("请先登录商家账号");
        }
        merchantService.deleteSpecGroup(merchantId, groupId);
        return Result.success();
    }

    /**
     * 添加规格值
     */
    @PostMapping("/merchant/product-specs")
    public Result<Void> addProductSpec(HttpServletRequest request, @RequestBody ProductSpec productSpec) {
        Long merchantId = (Long) request.getAttribute("merchantId");
        if (merchantId == null) {
            return Result.unauthorized("请先登录商家账号");
        }
        merchantService.addProductSpec(merchantId, productSpec);
        return Result.success();
    }

    /**
     * 删除规格值
     */
    @DeleteMapping("/merchant/product-specs/{specId}")
    public Result<Void> deleteProductSpec(HttpServletRequest request, @PathVariable Long specId) {
        Long merchantId = (Long) request.getAttribute("merchantId");
        if (merchantId == null) {
            return Result.unauthorized("请先登录商家账号");
        }
        merchantService.deleteProductSpec(merchantId, specId);
        return Result.success();
    }
}
