package com.project.app.ai.routing;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CategoryIntentRouterTest {

    private final CategoryIntentRouter router = new CategoryIntentRouter();

    @Test
    void understandsFlexibleIncomeCategoryRequests() {
        assertThat(router.detect("Cho tôi xem danh sách các danh mục thu nhập mà tôi đang có."))
                .isEqualTo(CategoryIntentRouter.CategoryIntent.INCOME_TYPES);
        assertThat(router.detect("Tôi có những nguồn thu nào?"))
                .isEqualTo(CategoryIntentRouter.CategoryIntent.INCOME_TYPES);
        assertThat(router.detect("Liệt kê phân loại tiền vào hiện tại"))
                .isEqualTo(CategoryIntentRouter.CategoryIntent.INCOME_TYPES);
    }

    @Test
    void keepsExpenseAndGenericInventorySeparate() {
        assertThat(router.detect("Tôi có các loại chi tiêu nào?"))
                .isEqualTo(CategoryIntentRouter.CategoryIntent.SPENDING_TYPES);
        assertThat(router.detect("Cho tôi xem danh mục của tôi"))
                .isEqualTo(CategoryIntentRouter.CategoryIntent.LIST);
    }
}
