package com.project.app.ai.orchestration;

import com.project.app.ai.dto.response.*;
import com.project.app.ai.entity.AiPendingAction;
import com.project.app.ai.repository.AiPendingActionRepository;
import com.project.app.budget.dto.request.CreateBudgetRequest;
import com.project.app.budget.enums.BudgetApplyTo;
import com.project.app.budget.service.BudgetService;
import com.project.app.category.dto.response.CategoryItemResponse;
import com.project.app.category.service.CategoryService;
import com.project.app.support.dto.request.CreateSupportTicketRequest;
import com.project.app.support.service.CustomerSupportService;
import com.project.app.user.entity.User;
import lombok.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.*;
import java.util.*;
import java.util.regex.*;

@Service @RequiredArgsConstructor
public class AiSafeActionService {
 private static final Pattern CONFIRM=Pattern.compile("(?i)^(ok|oke|đồng ý|dong y|xác nhận|xac nhan|tạo đi|tao di|gửi đi|gui di|yes)$");
 private static final Pattern CANCEL=Pattern.compile("(?i)^(hủy|huy|thôi|thoi|không|khong|bỏ qua|bo qua|cancel)$");
 private static final Pattern AMOUNT=Pattern.compile("(?i)(\\d+(?:[.,]\\d+)?)\\s*(triệu|trieu|tr|k|nghìn|nghin|000|đ|d)?");
 private final AiPendingActionRepository repository;
 private final CategoryService categoryService;
 private final BudgetService budgetService;
 private final CustomerSupportService supportService;

 public Optional<Result> handle(User user,String message){
  if(user==null||message==null||message.isBlank()) return Optional.empty();
  String text=message.trim(); Optional<AiPendingAction> pending=active(user.getId());
  if(pending.isPresent()&&CANCEL.matcher(normalize(text)).matches()){ repository.delete(pending.get()); return Optional.of(result("Đã hủy yêu cầu đang chờ.","GENERAL",null,null)); }
  if(pending.isPresent()&&CONFIRM.matcher(normalize(text)).matches()) return Optional.of(confirm(user,pending.get()));
  String normalized=normalize(text);
  if(normalized.contains("tao ngan sach")||normalized.contains("them ngan sach")) return Optional.of(proposeBudget(user,text));
  if(normalized.contains("tao yeu cau ho tro")||normalized.contains("gui ho tro")||normalized.contains("lien he ho tro")) return Optional.of(proposeSupport(user,text));
  return Optional.empty();
 }

 @Transactional
 protected Result proposeBudget(User user,String message){
  BigDecimal amount=parseAmount(message); if(amount==null||amount.compareTo(BigDecimal.valueOf(1000))<0) return result("Bạn hãy cho biết hạn mức ngân sách từ 1.000đ. Ví dụ: Tạo ngân sách Ăn uống 2 triệu tháng này.","BUDGET",null,null);
  CategoryItemResponse category=findCategory(user,message); if(category==null) return result("Tôi chưa xác định được danh mục. Hãy ghi đúng tên danh mục, ví dụ: Tạo ngân sách Ăn uống 2 triệu tháng này.","BUDGET",null,List.of(nav("open_budgets","Mở Ngân sách","/budget")));
  YearMonth month=normalize(message).contains("thang sau")?YearMonth.now().plusMonths(1):YearMonth.now();
  AiPendingAction draft=repository.findByUserId(user.getId()).orElseGet(AiPendingAction::new); draft.setUserId(user.getId()); draft.setType("CREATE_BUDGET"); draft.setCategoryId(category.getId()); draft.setSubject(category.getLabel()); draft.setContent(null); draft.setAmount(amount); draft.setStartDate(month.atDay(1)); draft.setEndDate(month.atEndOfMonth()); draft.setExpiresAt(LocalDateTime.now().plusMinutes(15)); repository.save(draft);
  AiCardDto card=AiCardDto.builder().type("BUDGET_STATUS").title("Xem trước ngân sách").items(List.of(item("Danh mục",category.getLabel()),item("Hạn mức",money(amount)),item("Thời gian",month.atDay(1)+" đến "+month.atEndOfMonth()))).build();
  return result("Tôi đã tạo bản nháp ngân sách. Hãy kiểm tra rồi xác nhận; yêu cầu sẽ hết hạn sau 15 phút.","BUDGET",List.of(card),confirmActions("confirm_create_budget"));
 }

 @Transactional
 protected Result proposeSupport(User user,String message){
  String content=message.replaceFirst("(?i).*(tạo yêu cầu hỗ trợ|tao yeu cau ho tro|gửi hỗ trợ|gui ho tro|liên hệ hỗ trợ|lien he ho tro)\\s*","").trim();
  if(content.length()<10) return result("Bạn hãy mô tả vấn đề cần hỗ trợ rõ hơn, tối thiểu 10 ký tự.","SUPPORT",null,List.of(nav("open_support","Mở Hỗ trợ","/settings/support")));
  String subject=content.length()>80?content.substring(0,80):content;
  AiPendingAction draft=repository.findByUserId(user.getId()).orElseGet(AiPendingAction::new); draft.setUserId(user.getId()); draft.setType("CREATE_SUPPORT"); draft.setSubject(subject); draft.setContent(content); draft.setCategoryId(null); draft.setAmount(null); draft.setStartDate(null); draft.setEndDate(null); draft.setExpiresAt(LocalDateTime.now().plusMinutes(15)); repository.save(draft);
  AiCardDto card=AiCardDto.builder().type("METRICS").title("Xem trước yêu cầu hỗ trợ").items(List.of(item("Tiêu đề",subject),item("Nội dung",content))).build();
  return result("Tôi đã soạn yêu cầu hỗ trợ. Xác nhận để gửi tới quản trị viên.","SUPPORT",List.of(card),confirmActions("confirm_create_support"));
 }

 @Transactional
 protected Result confirm(User user,AiPendingAction action){
  try{
   if("CREATE_BUDGET".equals(action.getType())){ CreateBudgetRequest request=new CreateBudgetRequest(); request.setCategoryId(action.getCategoryId()); request.setApplyTo(BudgetApplyTo.BOTH); request.setLimitAmount(action.getAmount()); request.setStartDate(action.getStartDate()); request.setEndDate(action.getEndDate()); budgetService.createBudget(user.getId(),request); repository.delete(action); return result("Đã tạo ngân sách "+action.getSubject()+" với hạn mức "+money(action.getAmount())+".","BUDGET",null,List.of(nav("view_budget","Xem ngân sách","/budget"))); }
   CreateSupportTicketRequest request=new CreateSupportTicketRequest(); request.setSubject(action.getSubject()); request.setContent(action.getContent()); supportService.createTicket(user,request); repository.delete(action); return result("Đã gửi yêu cầu hỗ trợ tới quản trị viên.","SUPPORT",null,List.of(nav("view_support","Xem yêu cầu","/settings/support")));
  }catch(Exception exception){ repository.delete(action); return result("Không thể thực hiện yêu cầu: "+exception.getMessage(),"GENERAL",null,null); }
 }

 private Optional<AiPendingAction> active(Long userId){ Optional<AiPendingAction> found=repository.findByUserId(userId); if(found.isPresent()&&found.get().getExpiresAt().isBefore(LocalDateTime.now())){repository.delete(found.get()); return Optional.empty();} return found; }
 private CategoryItemResponse findCategory(User user,String message){ String n=normalize(message); return categoryService.getCategoriesForUser(user.getId()).stream().flatMap(g->g.getItems().stream()).filter(i->n.contains(normalize(i.getLabel()))).findFirst().orElse(null); }
 private BigDecimal parseAmount(String text){ Matcher m=AMOUNT.matcher(text); BigDecimal best=null; while(m.find()){ BigDecimal value=new BigDecimal(m.group(1).replace(',','.')); String unit=m.group(2); if(unit!=null){String u=normalize(unit); if(u.startsWith("trieu")||u.equals("tr"))value=value.multiply(BigDecimal.valueOf(1_000_000)); else if(u.equals("k")||u.startsWith("nghin"))value=value.multiply(BigDecimal.valueOf(1_000));} if(best==null||value.compareTo(best)>0)best=value;} return best; }
 private String normalize(String value){return Normalizer.normalize(value,Normalizer.Form.NFD).replaceAll("\\p{M}+","").toLowerCase(Locale.ROOT).replace('đ','d').trim();}
 private String money(BigDecimal value){return String.format("%,.0f ₫",value).replace(',','.');}
 private AiCardItemDto item(String label,String value){return AiCardItemDto.builder().label(label).value(value).build();}
 private AiActionDto nav(String id,String label,String route){return AiActionDto.builder().id(id).label(label).type("NAVIGATE").route(route).build();}
 private List<AiActionDto> confirmActions(String id){return List.of(AiActionDto.builder().id(id).label("Xác nhận").type("SEND_MESSAGE").payload("Xác nhận").build(),AiActionDto.builder().id("cancel_action").label("Hủy").type("SEND_MESSAGE").payload("Hủy").build());}
 private Result result(String text,String module,List<AiCardDto> cards,List<AiActionDto> actions){return Result.builder().text(text).moduleType(module).cards(cards).actions(actions).build();}
 @Data @Builder public static class Result{private String text;private String moduleType;private List<AiCardDto> cards;private List<AiActionDto> actions;}
}
