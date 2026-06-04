package com.demo.evaluationservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.Review;
import java.util.List;

public interface IReviewService extends IService<Review> {
    List<Review> getReviewsByMerchantId(Long merchantId);
    List<Review> getReviewsByProductId(Long productId);
}