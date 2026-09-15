package com.project.app.ai.category;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CategoryCreateServiceParsingTest {

    private final CategoryCreateService service = new CategoryCreateService(null, null, null);

    @Test
    void parsesParentThenChild() {
        CategoryCreateService.ParsedCreate parsed = service.parseCreateMessage(
                "Tôi muốn tạo danh mục cha là Thu nhập và danh mục con là Tiền lương");

        assertThat(parsed.groupHint()).isEqualTo("Thu nhập");
        assertThat(parsed.label()).isEqualTo("Tiền lương");
        assertThat(parsed.explicitParent()).isTrue();
    }

    @Test
    void parsesChildThenParentWithNaturalWording() {
        CategoryCreateService.ParsedCreate parsed = service.parseCreateMessage(
                "hãy tạo danh mục con tên là abc vào danh mục cha tên là chi tiêu");

        assertThat(parsed.label()).isEqualTo("abc");
        assertThat(parsed.groupHint()).isEqualTo("chi tiêu");
        assertThat(parsed.explicitParent()).isTrue();
    }

    @Test
    void parsesBelongsToGroupVariant() {
        CategoryCreateService.ParsedCreate parsed = service.parseCreateMessage(
                "Thêm danh mục con Cafe thuộc nhóm Ăn uống");

        assertThat(parsed.label()).isEqualTo("Cafe");
        assertThat(parsed.groupHint()).isEqualTo("Ăn uống");
    }
}
