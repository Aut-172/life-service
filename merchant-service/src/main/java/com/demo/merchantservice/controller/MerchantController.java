package com.demo.merchantservice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.demo.common.dto.Response;
import com.demo.common.entity.Category;
import com.demo.common.entity.Merchant;
import com.demo.merchantservice.service.ICategoryService;
import com.demo.merchantservice.service.IMerchantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/merchant")
public class MerchantController {

    @Autowired
    private IMerchantService merchantService;
    @Autowired
    private ICategoryService categoryService;

    // ---------- 商家信息管理 ----------
    @GetMapping("/info")
    public Response<Merchant> getMerchantInfo() {
        Long merchantId = getCurrentMerchantId();
        return Response.success(merchantService.getById(merchantId));
    }

    @PutMapping("/info")
    public Response<Boolean> updateMerchantInfo(@RequestBody Merchant merchant) {
        Long merchantId = getCurrentMerchantId();
        merchant.setMerchantId(merchantId);
        return Response.success(merchantService.updateById(merchant));
    }

    // ---------- 商家分类管理（辅助） ----------
    @GetMapping("/categories")
    public Response<List<Category>> getCategories() {
        return Response.success(categoryService.list());
    }

    @PostMapping("/category")
    public Response<Boolean> addCategory(@RequestBody Category category) {
        return Response.success(categoryService.save(category));
    }

    // ---------- 管理员：商家管理 ----------
    @GetMapping("/admin/merchants")
    public Response<List<Merchant>> listMerchants(@RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<Merchant> wrapper = new LambdaQueryWrapper<>();
        if (status != null) wrapper.eq(Merchant::getMerchantStatus, status);
        return Response.success(merchantService.list(wrapper));
    }

    @PutMapping("/admin/merchant/status")
    public Response<Boolean> updateMerchantStatus(@RequestParam Long merchantId, @RequestParam Integer status) {
        return Response.success(merchantService.updateStatus(merchantId, status));
    }

    private Long getCurrentMerchantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Long) auth.getPrincipal();
    }
}