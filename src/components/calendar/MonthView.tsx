import { BellIcon } from '@chakra-ui/icons';
import {
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Box,
  HStack,
  Heading,
} from '@chakra-ui/react';
import React from 'react';

import { Event } from '../../types';
import { formatMonth, formatDate, getWeeksAtMonth, getEventsForDay } from '../../utils/dateUtils';

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  notifiedEvents: string[];
  weekDays: string[];
  holidays: Record<string, string>;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  notifiedEvents,
  weekDays,
  holidays,
}) => {
  const weeks = getWeeksAtMonth(currentDate);

  return (
    <VStack data-testid="month-view" align="stretch" w="full" spacing={4}>
      <Heading size="md">{formatMonth(currentDate)}</Heading>
      <Table variant="simple" w="full">
        <Thead>
          <Tr>
            {weekDays.map((day) => (
              <Th key={day} width="14.28%">
                {day}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {weeks.map((week, weekIndex) => (
            <Tr key={weekIndex}>
              {week.map((day, dayIndex) => {
                const dateString = day ? formatDate(currentDate, day) : '';
                const holiday = holidays[dateString];

                return (
                  <Td
                    key={dayIndex}
                    height="100px"
                    verticalAlign="top"
                    width="14.28%"
                    position="relative"
                  >
                    {day && (
                      <>
                        <Text fontWeight="bold">{day}</Text>
                        {holiday && (
                          <Text color="red.500" fontSize="sm">
                            {holiday}
                          </Text>
                        )}
                        {getEventsForDay(events, day).map((event) => {
                          const isNotified = notifiedEvents.includes(event.id);
                          const isRepeating = event.repeat.type !== 'none'; // 반복 일정 여부 확인
                          return (
                            <Box
                              key={event.id}
                              p={1}
                              my={1}
                              bg={isNotified ? 'red.100' : 'gray.100'}
                              borderRadius="md"
                              fontWeight={isNotified ? 'bold' : 'normal'}
                              color={isNotified ? 'red.500' : 'inherit'}
                            >
                              <HStack spacing={1}>
                                {isRepeating && (
                                  <Text fontSize="sm" color="blue.500">
                                    🔁
                                  </Text>
                                )}
                                {isNotified && <BellIcon />}
                                <Text fontSize="sm" noOfLines={1}>
                                  {event.title}
                                </Text>
                              </HStack>
                            </Box>
                          );
                        })}
                      </>
                    )}
                  </Td>
                );
              })}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </VStack>
  );
};
