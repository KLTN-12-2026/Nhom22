package com.do_an_tot_nghiep.k28.support.service;

import com.do_an_tot_nghiep.k28.account.dto.NotificationContact;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.support.dto.TicketResponse;
import com.do_an_tot_nghiep.k28.support.entity.PhanHoiPhieuHoTro;
import com.do_an_tot_nghiep.k28.support.entity.PhieuHoTro;
import com.do_an_tot_nghiep.k28.support.mapper.SupportTicketMapper;
import com.do_an_tot_nghiep.k28.support.repository.PhanHoiPhieuHoTroRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class SupportTicketAssembler {

    private final PhanHoiPhieuHoTroRepository replies;
    private final SupportTicketMapper mapper;
    private final AccountService accounts;

    List<TicketResponse> assemble(List<PhieuHoTro> tickets, boolean withRequester) {
        if (tickets.isEmpty()) {
            return List.of();
        }
        List<PhanHoiPhieuHoTro> all = replies.findByPhieuIdInOrderByCreatedAtAscIdAsc(
                tickets.stream().map(PhieuHoTro::getId).toList());
        Set<Long> userIds = new HashSet<>();
        all.forEach(reply -> userIds.add(reply.getNguoiXuLyId()));
        if (withRequester) {
            tickets.forEach(ticket -> userIds.add(ticket.getNguoiDungId()));
        }
        Map<Long, String> names = accounts.publicDisplayNames(userIds);
        Map<Long, NotificationContact> contacts = withRequester ? accounts.contacts(userIds) : Map.of();
        Map<Long, List<TicketResponse.PhanHoi>> byTicket = all.stream().collect(Collectors.groupingBy(
                PhanHoiPhieuHoTro::getPhieuId,
                Collectors.mapping(reply -> mapper.toPhanHoi(reply,
                        names.getOrDefault(reply.getNguoiXuLyId(), "Quản trị viên")), Collectors.toList())));
        return tickets.stream().map(ticket -> {
            TicketResponse.NguoiDung requester = null;
            if (withRequester) {
                NotificationContact contact = contacts.get(ticket.getNguoiDungId());
                requester = new TicketResponse.NguoiDung(
                        String.valueOf(ticket.getNguoiDungId()),
                        names.getOrDefault(ticket.getNguoiDungId(), "Học viên #" + ticket.getNguoiDungId()),
                        contact == null || contact.email() == null ? "" : contact.email());
            }
            return mapper.toResponse(ticket).with(requester, byTicket.getOrDefault(ticket.getId(), List.of()));
        }).toList();
    }
}
