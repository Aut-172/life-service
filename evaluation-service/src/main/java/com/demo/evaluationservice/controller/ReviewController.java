package com.demo.evaluationservice.controller;

import com.demo.common.dto.Response;
import com.demo.common.entity.Review;
import com.demo.evaluationservice.service.IReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/review")
public class ReviewController {

    @Autowired
    private IReviewService reviewService;

    // 用户添加评价
    @PostMapping
    public Response<Boolean> addReview(@RequestBody Review review) {
        Long userId = getCurrentUserId();
        review.setUserId(userId);
        return Response.success(reviewService.save(review));
    }

    // 查看某个商家的评价（商家自己查看，也供用户浏览）
    @GetMapping("/merchant/{merchantId}")
    public Response<List<Review>> getReviewsByMerchant(@PathVariable Long merchantId) {
        return Response.success(reviewService.getReviewsByMerchantId(merchantId));
    }

    // 商家查看自己店铺的评价（需验证当前登录商家ID与评价中商家ID一致）
    @GetMapping("/merchant/my")
    public Response<List<Review>> getMyMerchantReviews() {
        Long merchantId = getCurrentMerchantId();
        return Response.success(reviewService.getReviewsByMerchantId(merchantId));
    }

    // 查看某个商品的评价
    @GetMapping("/product/{productId}")
    public Response<List<Review>> getReviewsByProduct(@PathVariable Long productId) {
        return Response.success(reviewService.getReviewsByProductId(productId));
    }

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
    private Long getCurrentMerchantId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}