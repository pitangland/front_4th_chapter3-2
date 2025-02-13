import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils';
import { useEventForm } from '../../hooks/useEventForm';
import { useEventOperations } from '../../hooks/useEventOperations';
import { server } from '../../setupTests';
import { Event } from '../../types';

const toastFn = vi.fn();

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => toastFn,
  };
});

it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {
  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([
    {
      id: '1',
      title: '기존 회의',
      date: '2024-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ]);
});

it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
  setupMockHandlerCreation(); // ? Med: 이걸 왜 써야하는지 물어보자

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  const newEvent: Event = {
    id: '1',
    title: '새 회의',
    date: '2024-10-16',
    startTime: '11:00',
    endTime: '12:00',
    description: '새로운 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 5,
  };

  await act(async () => {
    await result.current.saveEvent(newEvent);
  });

  expect(result.current.events).toEqual([{ ...newEvent, id: '1' }]);
});

it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
  setupMockHandlerUpdating();

  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const updatedEvent: Event = {
    id: '1',
    date: '2024-10-15',
    startTime: '09:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
    title: '수정된 회의',
    endTime: '11:00',
  };

  await act(async () => {
    await result.current.saveEvent(updatedEvent);
  });

  expect(result.current.events[0]).toEqual(updatedEvent);
});

it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
  setupMockHandlerDeletion();

  const { result } = renderHook(() => useEventOperations(false));

  await act(async () => {
    await result.current.deleteEvent({ id: '1' });
  });

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([]);
});

it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
  server.use(http.get('/api/events', () => new HttpResponse(null, { status: 500 })));

  renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  expect(toastFn).toHaveBeenCalledWith({
    duration: 3000,
    isClosable: true,
    title: '이벤트 로딩 실패',
    status: 'error',
  });

  server.resetHandlers();
});

it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {
  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const nonExistentEvent: Event = {
    id: '999', // 존재하지 않는 ID
    title: '존재하지 않는 이벤트',
    date: '2024-07-20',
    startTime: '09:00',
    endTime: '10:00',
    description: '이 이벤트는 존재하지 않습니다',
    location: '어딘가',
    category: '기타',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(nonExistentEvent);
  });

  expect(toastFn).toHaveBeenCalledWith({
    duration: 3000,
    isClosable: true,
    title: '일정 저장 실패',
    status: 'error',
  });
});

it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
  server.use(http.delete('/api/events/:id', () => new HttpResponse(null, { status: 500 })));

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  await act(async () => {
    await result.current.deleteEvent({ id: '1' });
  });

  expect(toastFn).toHaveBeenCalledWith({
    duration: 3000,
    isClosable: true,
    title: '일정 삭제 실패',
    status: 'error',
  });

  expect(result.current.events).toHaveLength(1);
});

describe('반복 유형 선택 (with date-fns)', () => {
  it('초기 반복 유형은 none이어야 한다', () => {
    const { result } = renderHook(() => useEventForm());
    expect(result.current.repeatType).toBe('none');
  });

  it('반복 유형을 매일로 설정할 수 있다', () => {
    const { result } = renderHook(() => useEventForm());
    act(() => {
      result.current.setRepeatType('daily');
    });
    expect(result.current.repeatType).toBe('daily');
  });

  it('31일에 매월 반복일정을 설정할 경우 31일이 없는 달은 마지막 날로 설정해야 한다', () => {
    const { result } = renderHook(() => useEventForm());

    act(() => {
      result.current.setDate('2024-01-31');
      result.current.setRepeatType('monthly');
    });

    const nextDate = result.current.calculateNextRepeatDate(result.current.date);
    expect(nextDate).toBe('2024-02-29'); // 2월은 윤년이므로 29일까지
  });

  it('윤년 2월 29일에 매월 반복일정을 설정할 경우 다음 일정은 3월 29일이다', () => {
    const { result } = renderHook(() => useEventForm());

    act(() => {
      result.current.setDate('2024-02-29');
      result.current.setRepeatType('monthly');
    });

    const nextDate = result.current.calculateNextRepeatDate(result.current.date);
    expect(nextDate).toBe('2024-03-29');
  });

  it('반복 유형을 매년으로 설정 시 다음 해의 동일한 날짜로 설정된다', () => {
    const { result } = renderHook(() => useEventForm());

    act(() => {
      result.current.setDate('2023-05-10');
      result.current.setRepeatType('yearly');
    });

    const nextDate = result.current.calculateNextRepeatDate(result.current.date);
    expect(nextDate).toBe('2024-05-10');
  });
});

describe('반복 일정 단일 수정', () => {
  it('반복 일정에서 특정 날짜의 일정만 단일 일정으로 변경할 수 있다', async () => {
    setupMockHandlerUpdating();

    const { result } = renderHook(() => useEventOperations(true));

    await act(() => Promise.resolve(null));

    const updatedEvent: Event = {
      id: '2',
      date: '2024-10-15',
      startTime: '11:00',
      description: '기존 팀 미팅 2',
      location: '회의실 C',
      category: '업무 회의',
      repeat: {
        type: 'none',
        interval: 0,
      },
      notificationTime: 5,
      title: '수정된 회의',
      endTime: '11:00',
    };

    await act(async () => {
      await result.current.saveEvent(updatedEvent);
    });

    expect(result.current.events[1]).toEqual(updatedEvent);
  });
});

describe('반복 일정 단일 삭제', () => {
  it('반복 일정에서 특정 날짜의 일정만 삭제할 수 있다', async () => {
    const { result } = renderHook(() => useEventOperations(true, () => {}));

    await act(async () => {
      await result.current.deleteEvent({ id: '1', date: '2024-11-15' });
    });

    // 특정 날짜 삭제
    const deletedEvent = result.current.events.find((e) => e.date === '2024-11-15');
    expect(deletedEvent).toBeUndefined();

    // 이후 날짜 존재
    const existingEvent = result.current.events.find((e) => e.date === '2024-10-15');
    expect(existingEvent).toBeDefined();
  });
});
